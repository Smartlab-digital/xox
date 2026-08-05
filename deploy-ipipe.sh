#!/bin/zsh
set -euo pipefail

PROJECT_DIR=${0:A:h}
FTP_HOST="cgi8.ipipe.ru"
FTP_USER="fox_smat_ftp0"
DB_HOST="db8.ipipe.ru"
DB_NAME="fox_smat_db4"
DB_USER="fox_smat_db4"
REMOTE_RELATIVE="domains/xox.ru"
REMOTE_ABSOLUTE="/home/clients/fox_smat_ftp0/domains/xox.ru"

read_secret() {
  local service="$1" account="$2" prompt="$3" result=""
  result=$(security find-generic-password -w -a "$account" -s "$service" 2>/dev/null || true)
  if [[ -z "$result" ]]; then
    read -s "result?$prompt"
    echo >&2
  fi
  print -rn -- "$result"
}

FTP_PASSWORD=$(read_secret "xox-ipipe-ftp" "$FTP_USER" "Введите FTP-пароль iPipe: ")
DB_PASSWORD=$(read_secret "xox-ipipe-mysql" "$DB_USER" "Введите пароль MySQL: ")
if [[ -z "$FTP_PASSWORD" || -z "$DB_PASSWORD" ]]; then
  echo "Пароль не введён. Развёртывание остановлено." >&2
  exit 1
fi

DEPLOY_TMP=$(mktemp -d "${TMPDIR:-/tmp}/xox-deploy.XXXXXX")
trap 'rm -rf "$DEPLOY_TMP"; unset FTP_PASSWORD DB_PASSWORD' EXIT INT TERM
chmod 700 "$DEPLOY_TMP"

escape_netrc() {
  print -rn -- "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

{
  print -r -- "machine $FTP_HOST"
  print -r -- "login \"$(escape_netrc "$FTP_USER")\""
  print -r -- "password \"$(escape_netrc "$FTP_PASSWORD")\""
} > "$DEPLOY_TMP/netrc"
chmod 600 "$DEPLOY_TMP/netrc"

DB_PASSWORD_B64=$(print -rn -- "$DB_PASSWORD" | base64 | tr -d '\n')
cat > "$DEPLOY_TMP/config.php" <<CONFIG
<?php
return array(
    'db_host' => '$DB_HOST',
    'db_port' => 3306,
    'db_name' => '$DB_NAME',
    'db_user' => '$DB_USER',
    'db_password' => base64_decode('$DB_PASSWORD_B64'),
    'site_url' => 'http://xox.ru',
    'mail_from' => 'noreply@xox.ru'
);
CONFIG
chmod 600 "$DEPLOY_TMP/config.php"

CURL_FTPS=(--fail --silent --show-error --ssl-reqd --insecure --netrc-file "$DEPLOY_TMP/netrc" --connect-timeout 20 --max-time 120)
remote_base="$REMOTE_RELATIVE"
if ! curl "${CURL_FTPS[@]}" --list-only "ftp://$FTP_HOST/$remote_base/" >/dev/null 2>&1; then
  remote_base="$REMOTE_ABSOLUTE"
fi

echo "Загружаю защищённую конфигурацию базы в закрытый веб-сервером файл…"
curl "${CURL_FTPS[@]}" --ftp-create-dirs --upload-file "$DEPLOY_TMP/config.php" "ftp://$FTP_HOST/$remote_base/html/config.local.php"

files=(
  .htaccess api.php api-client.js auth.js app.js listing-form.js edit-listing.js
  index.html catalog.html product.html add-listing.html edit-listing.html account-action.html styles.css
  account-action.js
  migration-export.html migration-export.js migration-import.html migration-import.js
  assets/logo_xox.png
  assets/listings/record-player.jpg assets/listings/fujifilm-instax-mini-12-pink.webp
  assets/listings/camera-placeholder.svg assets/listings/pottery.jpg assets/listings/sewing.jpg
  assets/listings/garden.jpg assets/listings/photography.jpg assets/listings/armchair.jpg
  assets/listings/lamp.jpg assets/listings/bicycle.jpg assets/listings/listing-placeholder.svg
  uploads/.htaccess
)

echo "Загружаю ${#files[@]} файлов сайта…"
for relative in "${files[@]}"; do
  if [[ ! -f "$PROJECT_DIR/$relative" ]]; then
    echo "Не найден файл: $relative" >&2
    exit 1
  fi
  curl "${CURL_FTPS[@]}" --ftp-create-dirs --upload-file "$PROJECT_DIR/$relative" "ftp://$FTP_HOST/$remote_base/html/$relative"
  echo "  ✓ $relative"
done

echo "Файлы загружены. Проверяю API…"
if curl --fail --silent --show-error --max-time 30 'http://xox.ru/api.php?action=health'; then
  echo
  echo "XOX успешно развёрнут: http://xox.ru/"
else
  echo
  echo "Файлы загружены, но xox.ru пока не отвечает по HTTP. Проверьте DNS в панели iPipe." >&2
fi
