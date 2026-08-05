<?php
declare(strict_types=1);

/*
 * XOX JSON API for iPipe hosting.
 * PHP 7.3 compatible. The production config lives one directory above html:
 * /home/clients/fox_smat_ftp0/domains/xox.ru/config.php
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

$secureCookie = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name('xox_session');
session_set_cookie_params(0, '/', '', $secureCookie, true);
session_start();

function respond($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400, string $code = 'bad_request'): void
{
    respond(array('error' => $message, 'code' => $code), $status);
}

function request_data(): array
{
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? (string) $_SERVER['CONTENT_TYPE'] : '';
    if (strpos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        if (!is_array($data)) {
            fail('Некорректный JSON.', 400, 'invalid_json');
        }
        return $data;
    }
    return $_POST;
}

function clean_text($value, int $max = 255): string
{
    $text = trim((string) $value);
    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $max, 'UTF-8');
    }
    return substr($text, 0, $max);
}

function json_array($value): array
{
    if (is_array($value)) {
        return array_values(array_filter(array_map(function ($item) {
            return clean_text($item, 80);
        }, $value), function ($item) {
            return $item !== '';
        }));
    }
    $decoded = json_decode((string) $value, true);
    return is_array($decoded) ? $decoded : array();
}

function config(): array
{
    $paths = array(
        dirname(__DIR__) . '/config.php',
        __DIR__ . '/config.local.php'
    );
    foreach ($paths as $path) {
        if (is_file($path)) {
            $loaded = require $path;
            if (is_array($loaded)) {
                return $loaded;
            }
        }
    }
    fail('Сервер ещё не настроен: отсутствует config.php.', 503, 'not_configured');
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $cfg = config();
    foreach (array('db_host', 'db_name', 'db_user', 'db_password') as $required) {
        if (!isset($cfg[$required])) {
            fail('В конфигурации отсутствует параметр ' . $required . '.', 503, 'invalid_config');
        }
    }
    $dsn = 'mysql:host=' . $cfg['db_host'] . ';dbname=' . $cfg['db_name'] . ';charset=utf8mb4';
    if (!empty($cfg['db_port'])) {
        $dsn .= ';port=' . (int) $cfg['db_port'];
    }
    try {
        $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_password'], array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ));
        migrate($pdo);
        return $pdo;
    } catch (Throwable $error) {
        error_log('XOX database error: ' . $error->getMessage());
        fail('Не удалось подключиться к базе данных.', 503, 'database_unavailable');
    }
}

function migrate(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $queries = array(
        'CREATE TABLE IF NOT EXISTS users (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(160) NOT NULL,
            email VARCHAR(190) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            phone VARCHAR(80) NOT NULL DEFAULT "",
            country VARCHAR(100) NOT NULL DEFAULT "",
            city VARCHAR(120) NOT NULL DEFAULT "",
            address VARCHAR(255) NOT NULL DEFAULT "",
            website VARCHAR(255) NOT NULL DEFAULT "",
            gender VARCHAR(40) NOT NULL DEFAULT "",
            age SMALLINT UNSIGNED NULL,
            bio TEXT NULL,
            avatar_path VARCHAR(255) NOT NULL DEFAULT "",
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id), UNIQUE KEY users_email_unique (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
        'CREATE TABLE IF NOT EXISTS listings (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            owner_id BIGINT UNSIGNED NOT NULL,
            kind VARCHAR(20) NOT NULL DEFAULT "item",
            title VARCHAR(180) NOT NULL,
            country VARCHAR(100) NOT NULL DEFAULT "",
            city VARCHAR(120) NOT NULL DEFAULT "",
            category VARCHAR(120) NOT NULL DEFAULT "",
            item_condition VARCHAR(120) NOT NULL DEFAULT "",
            price DECIMAL(12,2) NULL,
            currency VARCHAR(8) NOT NULL DEFAULT "RUB",
            unit VARCHAR(80) NOT NULL DEFAULT "",
            description TEXT NOT NULL,
            keywords VARCHAR(500) NOT NULL DEFAULT "",
            wanted VARCHAR(500) NOT NULL DEFAULT "",
            status VARCHAR(20) NOT NULL DEFAULT "active",
            seller_type VARCHAR(80) NOT NULL DEFAULT "Частное лицо",
            seller_name VARCHAR(160) NOT NULL DEFAULT "",
            phone VARCHAR(80) NOT NULL DEFAULT "",
            email VARCHAR(190) NOT NULL DEFAULT "",
            address VARCHAR(255) NOT NULL DEFAULT "",
            website VARCHAR(255) NOT NULL DEFAULT "",
            operations TEXT NOT NULL,
            service_place TEXT NOT NULL,
            views INT UNSIGNED NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id), KEY listings_owner_idx (owner_id), KEY listings_status_idx (status),
            CONSTRAINT listings_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
        'CREATE TABLE IF NOT EXISTS listing_photos (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            listing_id BIGINT UNSIGNED NOT NULL,
            path VARCHAR(255) NOT NULL,
            sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id), KEY photos_listing_idx (listing_id),
            CONSTRAINT photos_listing_fk FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
        'CREATE TABLE IF NOT EXISTS favorites (
            user_id BIGINT UNSIGNED NOT NULL,
            listing_id BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, listing_id),
            CONSTRAINT favorites_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT favorites_listing_fk FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
        'CREATE TABLE IF NOT EXISTS exchanges (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            sender_id BIGINT UNSIGNED NOT NULL,
            from_listing_id BIGINT UNSIGNED NOT NULL,
            to_listing_id BIGINT UNSIGNED NOT NULL,
            message VARCHAR(1000) NOT NULL DEFAULT "",
            status VARCHAR(30) NOT NULL DEFAULT "proposed",
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id), KEY exchanges_target_idx (to_listing_id),
            CONSTRAINT exchanges_sender_fk FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT exchanges_from_fk FOREIGN KEY (from_listing_id) REFERENCES listings(id) ON DELETE CASCADE,
            CONSTRAINT exchanges_to_fk FOREIGN KEY (to_listing_id) REFERENCES listings(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    foreach ($queries as $query) {
        $pdo->exec($query);
    }
    $done = true;
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
    }
    return $_SESSION['csrf'];
}

function require_csrf(): void
{
    $provided = isset($_SERVER['HTTP_X_XOX_CSRF']) ? (string) $_SERVER['HTTP_X_XOX_CSRF'] : '';
    if ($provided === '' || !hash_equals(csrf_token(), $provided)) {
        fail('Сессия формы устарела. Обновите страницу.', 419, 'csrf_failed');
    }
}

function current_user_id(): int
{
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;
}

function require_user(): int
{
    $id = current_user_id();
    if ($id < 1) {
        fail('Необходимо войти в аккаунт.', 401, 'auth_required');
    }
    return $id;
}

function public_user(array $row): array
{
    return array(
        'id' => (string) $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'country' => $row['country'],
        'city' => $row['city'],
        'address' => $row['address'],
        'website' => $row['website'],
        'gender' => $row['gender'],
        'age' => $row['age'] === null ? '' : (string) $row['age'],
        'bio' => $row['bio'] ?: '',
        'avatar' => $row['avatar_path'] ?: ''
    );
}

function get_user(PDO $pdo, int $id): ?array
{
    $query = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $query->execute(array($id));
    $row = $query->fetch();
    return $row ?: null;
}

function verify_captcha(array $data): void
{
    $answer = isset($data['captcha']) ? trim((string) $data['captcha']) : '';
    $expected = isset($_SESSION['captcha_answer']) ? (string) $_SESSION['captcha_answer'] : '';
    $created = isset($_SESSION['captcha_created']) ? (int) $_SESSION['captcha_created'] : 0;
    unset($_SESSION['captcha_answer'], $_SESSION['captcha_created']);
    if ($expected === '' || time() - $created > 600 || !hash_equals($expected, $answer)) {
        fail('Неверный ответ CAPTCHA.', 422, 'captcha_failed');
    }
}

function save_data_image(string $value, string $folder, int $maxBytes): string
{
    if (!preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$#', $value, $matches)) {
        fail('Неподдерживаемый формат изображения.', 422, 'invalid_image');
    }
    $binary = base64_decode($matches[2], true);
    if ($binary === false || strlen($binary) > $maxBytes || @getimagesizefromstring($binary) === false) {
        fail('Изображение повреждено или слишком велико.', 422, 'invalid_image');
    }
    $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
    $relativeDir = 'uploads/' . $folder;
    $absoluteDir = __DIR__ . '/' . $relativeDir;
    if (!is_dir($absoluteDir) && !mkdir($absoluteDir, 0755, true) && !is_dir($absoluteDir)) {
        fail('Не удалось подготовить каталог загрузок.', 500, 'upload_failed');
    }
    $name = bin2hex(random_bytes(18)) . '.' . $extension;
    if (file_put_contents($absoluteDir . '/' . $name, $binary, LOCK_EX) === false) {
        fail('Не удалось сохранить изображение.', 500, 'upload_failed');
    }
    return $relativeDir . '/' . $name;
}

function remove_uploaded_file(string $path): void
{
    if (strpos($path, 'uploads/') !== 0) {
        return;
    }
    $absolute = __DIR__ . '/' . $path;
    if (is_file($absolute)) {
        @unlink($absolute);
    }
}

function listing_rows(PDO $pdo, string $where = 'l.status = "active"', array $params = array()): array
{
    $viewer = current_user_id();
    $sql = 'SELECT l.*, u.name AS owner_name, u.email AS owner_email, u.country AS owner_country,
                   u.city AS owner_city, u.address AS owner_address, u.avatar_path AS owner_avatar,
                   (SELECT COUNT(*) FROM favorites f WHERE f.listing_id = l.id) AS likes,
                   EXISTS(SELECT 1 FROM favorites vf WHERE vf.listing_id = l.id AND vf.user_id = ?) AS is_favorite
            FROM listings l JOIN users u ON u.id = l.owner_id
            WHERE ' . $where . ' ORDER BY l.created_at DESC';
    $query = $pdo->prepare($sql);
    $query->execute(array_merge(array($viewer), $params));
    $rows = $query->fetchAll();
    if (!$rows) {
        return array();
    }
    $ids = array_map(function ($row) { return (int) $row['id']; }, $rows);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $photoQuery = $pdo->prepare('SELECT listing_id, path FROM listing_photos WHERE listing_id IN (' . $placeholders . ') ORDER BY sort_order, id');
    $photoQuery->execute($ids);
    $photos = array();
    foreach ($photoQuery->fetchAll() as $photo) {
        $photos[(string) $photo['listing_id']][] = $photo['path'];
    }
    return array_map(function ($row) use ($photos, $viewer) {
        $id = (string) $row['id'];
        $images = isset($photos[$id]) ? $photos[$id] : array();
        return array(
            'id' => $id,
            'owner' => array(
                'id' => (string) $row['owner_id'], 'name' => $row['owner_name'],
                'email' => $row['owner_email'], 'country' => $row['owner_country'],
                'city' => $row['owner_city'], 'address' => $row['owner_address'],
                'avatar' => $row['owner_avatar']
            ),
            'kind' => $row['kind'], 'title' => $row['title'], 'country' => $row['country'],
            'city' => $row['city'], 'category' => $row['category'], 'condition' => $row['item_condition'],
            'price' => $row['price'] === null ? '' : (string) $row['price'], 'currency' => $row['currency'],
            'unit' => $row['unit'], 'description' => $row['description'], 'keywords' => $row['keywords'],
            'wanted' => $row['wanted'], 'status' => $row['status'], 'sellerType' => $row['seller_type'],
            'sellerName' => $row['seller_name'], 'phone' => $row['phone'], 'email' => $row['email'],
            'address' => $row['address'], 'website' => $row['website'],
            'operations' => json_array($row['operations']), 'servicePlace' => json_array($row['service_place']),
            'views' => (int) $row['views'], 'likes' => (int) $row['likes'],
            'images' => $images, 'image' => isset($images[0]) ? $images[0] : '',
            'createdAt' => date(DATE_ATOM, strtotime($row['created_at'])),
            'updatedAt' => date(DATE_ATOM, strtotime($row['updated_at'])),
            'isOwned' => $viewer > 0 && $viewer === (int) $row['owner_id'],
            'isFavorite' => (bool) $row['is_favorite']
        );
    }, $rows);
}

function listing_payload(array $data): array
{
    $kind = isset($data['kind']) && $data['kind'] === 'service' ? 'service' : 'item';
    $title = clean_text(isset($data['title']) ? $data['title'] : '', 180);
    $description = clean_text(isset($data['description']) ? $data['description'] : '', 10000);
    $operations = json_array(isset($data['operations']) ? $data['operations'] : array());
    $places = json_array(isset($data['servicePlace']) ? $data['servicePlace'] : array());
    if ($title === '' || $description === '' || !$operations) {
        fail('Заполните название, описание и выберите операцию.', 422, 'validation_failed');
    }
    if ($kind === 'service' && !$places) {
        fail('Выберите место оказания услуги.', 422, 'validation_failed');
    }
    $price = isset($data['price']) && $data['price'] !== '' ? (float) $data['price'] : null;
    if ($price !== null && ($price < 0 || $price > 9999999999)) {
        fail('Укажите корректную цену.', 422, 'validation_failed');
    }
    return array(
        $kind, $title, clean_text(isset($data['country']) ? $data['country'] : '', 100),
        clean_text(isset($data['city']) ? $data['city'] : '', 120), clean_text(isset($data['category']) ? $data['category'] : '', 120),
        $kind === 'item' ? clean_text(isset($data['condition']) ? $data['condition'] : '', 120) : '', $price,
        clean_text(isset($data['currency']) ? $data['currency'] : 'RUB', 8), clean_text(isset($data['unit']) ? $data['unit'] : '', 80),
        $description, clean_text(isset($data['keywords']) ? $data['keywords'] : '', 500), clean_text(isset($data['wanted']) ? $data['wanted'] : '', 500),
        isset($data['status']) && $data['status'] === 'archive' ? 'archive' : 'active', clean_text(isset($data['sellerType']) ? $data['sellerType'] : 'Частное лицо', 80),
        clean_text(isset($data['sellerName']) ? $data['sellerName'] : '', 160), clean_text(isset($data['phone']) ? $data['phone'] : '', 80),
        clean_text(isset($data['email']) ? $data['email'] : '', 190), clean_text(isset($data['address']) ? $data['address'] : '', 255),
        clean_text(isset($data['website']) ? $data['website'] : '', 255), json_encode($operations, JSON_UNESCAPED_UNICODE),
        json_encode($places, JSON_UNESCAPED_UNICODE)
    );
}

$method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper($_SERVER['REQUEST_METHOD']) : 'GET';
$action = isset($_GET['action']) ? (string) $_GET['action'] : 'health';

if ($method === 'OPTIONS') {
    respond(array('ok' => true));
}

if ($action === 'health' && $method === 'GET') {
    db();
    respond(array('ok' => true, 'php' => PHP_VERSION, 'database' => true));
}

if ($action === 'captcha' && $method === 'GET') {
    $a = random_int(2, 9);
    $b = random_int(2, 9);
    $_SESSION['captcha_answer'] = (string) ($a + $b);
    $_SESSION['captcha_created'] = time();
    respond(array('question' => $a . ' + ' . $b . ' = ?', 'csrf' => csrf_token()));
}

if ($action === 'me' && $method === 'GET') {
    $user = current_user_id() ? get_user(db(), current_user_id()) : null;
    respond(array('user' => $user ? public_user($user) : null, 'csrf' => csrf_token()));
}

if ($action === 'register' && $method === 'POST') {
    require_csrf();
    $data = request_data();
    verify_captcha($data);
    $name = clean_text(isset($data['name']) ? $data['name'] : '', 160);
    $email = strtolower(clean_text(isset($data['email']) ? $data['email'] : '', 190));
    $password = isset($data['password']) ? (string) $data['password'] : '';
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
        fail('Укажите имя, корректный email и пароль не короче 8 символов.', 422, 'validation_failed');
    }
    $pdo = db();
    $exists = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $exists->execute(array($email));
    if ($exists->fetch()) {
        fail('Аккаунт с таким email уже существует.', 409, 'email_exists');
    }
    $avatar = '';
    if (!empty($data['avatar'])) {
        $avatar = save_data_image((string) $data['avatar'], 'avatars', 3 * 1024 * 1024);
    }
    $query = $pdo->prepare('INSERT INTO users (name,email,password_hash,phone,country,city,address,website,gender,age,bio,avatar_path) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    $age = isset($data['age']) && $data['age'] !== '' ? max(14, min(120, (int) $data['age'])) : null;
    $query->execute(array($name, $email, password_hash($password, PASSWORD_DEFAULT),
        clean_text(isset($data['phone']) ? $data['phone'] : '', 80), clean_text(isset($data['country']) ? $data['country'] : '', 100),
        clean_text(isset($data['city']) ? $data['city'] : '', 120), clean_text(isset($data['address']) ? $data['address'] : '', 255),
        clean_text(isset($data['website']) ? $data['website'] : '', 255), clean_text(isset($data['gender']) ? $data['gender'] : '', 40),
        $age, clean_text(isset($data['bio']) ? $data['bio'] : '', 3000), $avatar));
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $pdo->lastInsertId();
    $_SESSION['csrf'] = bin2hex(random_bytes(24));
    respond(array('user' => public_user(get_user($pdo, current_user_id())), 'csrf' => csrf_token()), 201);
}

if ($action === 'login' && $method === 'POST') {
    require_csrf();
    $data = request_data();
    verify_captcha($data);
    $email = strtolower(clean_text(isset($data['email']) ? $data['email'] : '', 190));
    $query = db()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $query->execute(array($email));
    $user = $query->fetch();
    if (!$user || !password_verify(isset($data['password']) ? (string) $data['password'] : '', $user['password_hash'])) {
        fail('Неверный email или пароль.', 401, 'invalid_credentials');
    }
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['csrf'] = bin2hex(random_bytes(24));
    respond(array('user' => public_user($user), 'csrf' => csrf_token()));
}

if ($action === 'logout' && $method === 'POST') {
    require_csrf();
    $_SESSION = array();
    session_destroy();
    respond(array('ok' => true));
}

if ($action === 'profile' && $method === 'PUT') {
    require_csrf();
    $userId = require_user();
    $data = request_data();
    $pdo = db();
    $current = get_user($pdo, $userId);
    $email = strtolower(clean_text(isset($data['email']) ? $data['email'] : $current['email'], 190));
    $name = clean_text(isset($data['name']) ? $data['name'] : $current['name'], 160);
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Укажите имя и корректный email.', 422, 'validation_failed');
    }
    $avatar = $current['avatar_path'];
    if (!empty($data['avatar']) && strpos((string) $data['avatar'], 'data:image/') === 0) {
        $newAvatar = save_data_image((string) $data['avatar'], 'avatars', 3 * 1024 * 1024);
        remove_uploaded_file($avatar);
        $avatar = $newAvatar;
    }
    $query = $pdo->prepare('UPDATE users SET name=?,email=?,phone=?,country=?,city=?,address=?,website=?,gender=?,age=?,bio=?,avatar_path=? WHERE id=?');
    $age = isset($data['age']) && $data['age'] !== '' ? max(14, min(120, (int) $data['age'])) : null;
    try {
        $query->execute(array($name, $email, clean_text(isset($data['phone']) ? $data['phone'] : '', 80),
            clean_text(isset($data['country']) ? $data['country'] : '', 100), clean_text(isset($data['city']) ? $data['city'] : '', 120),
            clean_text(isset($data['address']) ? $data['address'] : '', 255), clean_text(isset($data['website']) ? $data['website'] : '', 255),
            clean_text(isset($data['gender']) ? $data['gender'] : '', 40), $age, clean_text(isset($data['bio']) ? $data['bio'] : '', 3000),
            $avatar, $userId));
    } catch (PDOException $error) {
        if ((string) $error->getCode() === '23000') {
            fail('Этот email уже используется.', 409, 'email_exists');
        }
        throw $error;
    }
    respond(array('user' => public_user(get_user($pdo, $userId))));
}

if ($action === 'listings' && $method === 'GET') {
    $scope = isset($_GET['scope']) ? (string) $_GET['scope'] : 'public';
    if ($scope === 'mine') {
        $userId = require_user();
        respond(array('listings' => listing_rows(db(), 'l.owner_id = ?', array($userId))));
    }
    if ($scope === 'favorites') {
        $userId = require_user();
        respond(array('listings' => listing_rows(db(), 'l.status = "active" AND EXISTS (SELECT 1 FROM favorites fx WHERE fx.listing_id=l.id AND fx.user_id=?)', array($userId))));
    }
    if (!empty($_GET['id'])) {
        $id = (int) $_GET['id'];
        $rows = listing_rows(db(), 'l.id = ? AND (l.status = "active" OR l.owner_id = ?)', array($id, current_user_id()));
        if (!$rows) {
            fail('Объявление не найдено.', 404, 'not_found');
        }
        respond(array('listing' => $rows[0]));
    }
    respond(array('listings' => listing_rows(db())));
}

if ($action === 'listings' && $method === 'POST') {
    require_csrf();
    $userId = require_user();
    $data = request_data();
    $payload = listing_payload($data);
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $query = $pdo->prepare('INSERT INTO listings (owner_id,kind,title,country,city,category,item_condition,price,currency,unit,description,keywords,wanted,status,seller_type,seller_name,phone,email,address,website,operations,service_place) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $query->execute(array_merge(array($userId), $payload));
        $listingId = (int) $pdo->lastInsertId();
        $images = isset($data['images']) && is_array($data['images']) ? array_slice($data['images'], 0, 6) : array();
        $photoQuery = $pdo->prepare('INSERT INTO listing_photos (listing_id,path,sort_order) VALUES (?,?,?)');
        foreach ($images as $index => $image) {
            $path = save_data_image((string) $image, 'listings', 4 * 1024 * 1024);
            $photoQuery->execute(array($listingId, $path, $index));
        }
        $pdo->commit();
        $rows = listing_rows($pdo, 'l.id = ?', array($listingId));
        respond(array('listing' => $rows[0]), 201);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

if ($action === 'listings' && $method === 'PUT') {
    require_csrf();
    $userId = require_user();
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    $data = request_data();
    $pdo = db();
    $owned = $pdo->prepare('SELECT id FROM listings WHERE id=? AND owner_id=?');
    $owned->execute(array($id, $userId));
    if (!$owned->fetch()) {
        fail('Редактирование этого объявления недоступно.', 403, 'forbidden');
    }
    $payload = listing_payload($data);
    $pdo->beginTransaction();
    try {
        $query = $pdo->prepare('UPDATE listings SET kind=?,title=?,country=?,city=?,category=?,item_condition=?,price=?,currency=?,unit=?,description=?,keywords=?,wanted=?,status=?,seller_type=?,seller_name=?,phone=?,email=?,address=?,website=?,operations=?,service_place=? WHERE id=? AND owner_id=?');
        $query->execute(array_merge($payload, array($id, $userId)));
        if (isset($data['images']) && is_array($data['images'])) {
            $oldQuery = $pdo->prepare('SELECT path FROM listing_photos WHERE listing_id=?');
            $oldQuery->execute(array($id));
            $old = $oldQuery->fetchAll();
            $pdo->prepare('DELETE FROM listing_photos WHERE listing_id=?')->execute(array($id));
            $oldPaths = array_map(function ($photo) { return $photo['path']; }, $old);
            $newPaths = array();
            $photoQuery = $pdo->prepare('INSERT INTO listing_photos (listing_id,path,sort_order) VALUES (?,?,?)');
            foreach (array_slice($data['images'], 0, 6) as $index => $image) {
                if (strpos((string) $image, 'data:image/') === 0) {
                    $path = save_data_image((string) $image, 'listings', 4 * 1024 * 1024);
                } elseif (preg_match('#^uploads/listings/[A-Za-z0-9._-]+$#', (string) $image) && in_array((string) $image, $oldPaths, true)) {
                    $path = (string) $image;
                } else {
                    continue;
                }
                $newPaths[] = $path;
                $photoQuery->execute(array($id, $path, $index));
            }
            foreach ($oldPaths as $oldPath) {
                if (!in_array($oldPath, $newPaths, true)) {
                    remove_uploaded_file($oldPath);
                }
            }
        }
        $pdo->commit();
        $rows = listing_rows($pdo, 'l.id = ?', array($id));
        respond(array('listing' => $rows[0]));
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

if ($action === 'favorite' && ($method === 'POST' || $method === 'DELETE')) {
    require_csrf();
    $userId = require_user();
    $data = request_data();
    $listingId = isset($data['listingId']) ? (int) $data['listingId'] : 0;
    if ($listingId < 1) {
        fail('Объявление не найдено.', 404, 'not_found');
    }
    if ($method === 'POST') {
        $query = db()->prepare('INSERT IGNORE INTO favorites (user_id,listing_id) VALUES (?,?)');
        $query->execute(array($userId, $listingId));
    } else {
        $query = db()->prepare('DELETE FROM favorites WHERE user_id=? AND listing_id=?');
        $query->execute(array($userId, $listingId));
    }
    respond(array('favorite' => $method === 'POST'));
}

if ($action === 'exchange' && $method === 'POST') {
    require_csrf();
    $userId = require_user();
    $data = request_data();
    $from = isset($data['fromListingId']) ? (int) $data['fromListingId'] : 0;
    $to = isset($data['toListingId']) ? (int) $data['toListingId'] : 0;
    $pdo = db();
    $check = $pdo->prepare('SELECT id FROM listings WHERE id=? AND owner_id=? AND status="active"');
    $check->execute(array($from, $userId));
    if (!$check->fetch() || $from === $to) {
        fail('Выберите своё активное объявление.', 422, 'validation_failed');
    }
    $query = $pdo->prepare('INSERT INTO exchanges (sender_id,from_listing_id,to_listing_id,message) VALUES (?,?,?,?)');
    $query->execute(array($userId, $from, $to, clean_text(isset($data['message']) ? $data['message'] : '', 1000)));
    respond(array('ok' => true, 'id' => (string) $pdo->lastInsertId()), 201);
}

fail('Метод API не найден.', 404, 'not_found');
