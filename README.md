# XOX

Responsive marketplace for things and services with a PHP/MySQL backend.

The production API stores shared users, listings, photos, favorites, and exchange offers in MySQL. Copy `config.example.php` to `config.local.php` for local development. On iPipe, where files can only be uploaded into `html`, keep the same `config.local.php` name; `.htaccess` blocks direct web access to it.

- `GET api.php?action=listings`
- `POST api.php?action=listings`
- `POST api.php?action=register` — минимальная регистрация по email
- `POST api.php?action=verify-email` — подтверждение email и вход в сессию
- `POST api.php?action=complete-registration` — создание пароля после подтверждения
- `GET api.php?action=auth-providers` — состояние социальных провайдеров
- `POST api.php?action=login`

The iPipe deployment script uses explicit FTPS and reads passwords from macOS Keychain, falling back to hidden interactive prompts:

```sh
./deploy-ipipe.sh
```

## Email confirmation and password recovery

New accounts receive a one-time verification link valid for 48 hours. Password
reset links are valid for one hour. Only SHA-256 token hashes are stored in the
database. Accounts created before this feature is deployed are marked verified
during the one-time schema migration.

The iPipe `config.local.php` may define:

```php
'site_url' => 'http://xox.ru',
'mail_from' => 'noreply@xox.ru'
```

The domain must allow PHP `mail()` and should have SPF, DKIM and DMARC records
configured before production use. After SSL is enabled, change `site_url` to
`https://xox.ru` so links in new emails use HTTPS.

## Перенос старых локальных объявлений

Старая версия GitHub Pages сохраняла пользовательские карточки только в
`localStorage` конкретного браузера. Поэтому сервер не может автоматически
забрать объявления со всех устройств.

1. На том же устройстве и в том же браузере откройте
   `https://smartlab-digital.github.io/xox/migration-export.html`.
2. Скачайте JSON-файл переноса. Пароли и их хеши в него не включаются.
3. На `http://xox.ru/migration-import.html` войдите или зарегистрируйтесь с тем
   же email.
4. Выберите JSON-файл и запустите импорт.

Импорт принимает только карточки, у которых email старого владельца совпадает
с email текущего серверного аккаунта. Повторно уже перенесённые карточки
пропускаются по совпадению типа, названия и описания.

## Photo credits

Listing photography is sourced from [Unsplash](https://unsplash.com) and stored locally for a stable demo: Dragon White Munthe, Andreas Haimerl, Vitaly Gariev, Tuaans, Yasin Onuş, Bimbingan Islam, and Jael Rodriguez.
