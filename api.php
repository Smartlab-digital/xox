<?php
// XOX JSON API starter. Run locally: php -S localhost:8000
header('Content-Type: application/json; charset=utf-8');
$db = new PDO('sqlite:' . __DIR__ . '/xox.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, city TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)');
$db->exec('CREATE TABLE IF NOT EXISTS listings (id INTEGER PRIMARY KEY, owner_id INTEGER, title TEXT NOT NULL, kind TEXT CHECK(kind IN ("item","service")), status TEXT DEFAULT "active", operations TEXT, price REAL, currency TEXT DEFAULT "RUB", description TEXT, rating INTEGER DEFAULT 0, views INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)');
$db->exec('CREATE TABLE IF NOT EXISTS exchanges (id INTEGER PRIMARY KEY, from_listing INTEGER, to_listing INTEGER, status TEXT DEFAULT "proposed", created_at TEXT DEFAULT CURRENT_TIMESTAMP)');
$method=$_SERVER['REQUEST_METHOD']; $path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
if($method==='GET' && $path==='/api/listings'){ echo json_encode($db->query('SELECT * FROM listings WHERE status="active" ORDER BY created_at DESC')->fetchAll(PDO::FETCH_ASSOC)); exit; }
if($method==='POST' && $path==='/api/listings'){ $data=json_decode(file_get_contents('php://input'),true)?:[]; if(empty($data['title'])){http_response_code(422);echo json_encode(['error'=>'title required']);exit;} $q=$db->prepare('INSERT INTO listings(owner_id,title,kind,operations,price,description) VALUES(?,?,?,?,?,?)');$q->execute([$data['owner_id']??1,$data['title'],$data['kind']??'item',json_encode($data['operations']??[]),$data['price']??null,$data['description']??'']);echo json_encode(['id'=>$db->lastInsertId()]);exit; }
http_response_code(404); echo json_encode(['error'=>'Endpoint not found']);

