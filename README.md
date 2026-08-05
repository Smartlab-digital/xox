# XOX

Responsive marketplace for things and services with a PHP/MySQL backend.

The production API stores shared users, listings, photos, favorites, and exchange offers in MySQL. Copy `config.example.php` to `config.local.php` for local development. On iPipe, where files can only be uploaded into `html`, keep the same `config.local.php` name; `.htaccess` blocks direct web access to it.

- `GET api.php?action=listings`
- `POST api.php?action=listings`
- `POST api.php?action=register`
- `POST api.php?action=login`

The iPipe deployment script uses explicit FTPS and reads passwords from macOS Keychain, falling back to hidden interactive prompts:

```sh
./deploy-ipipe.sh
```

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
