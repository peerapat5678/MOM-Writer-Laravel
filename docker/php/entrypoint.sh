#!/bin/sh
set -e

cd /var/www/html

# .env is often created on Windows (Copy-Item) and arrives with CRLF line
# endings. That breaks the APP_KEY check below and can confuse Laravel's env
# parsing, so normalize it to LF first.
if [ -f .env ] && [ -w .env ]; then
    sed -i 's/\r$//' .env
fi

if [ ! -f vendor/autoload.php ]; then
    composer install --no-interaction --prefer-dist
fi

if [ -f artisan ]; then
    if [ -w .env ] && grep -Eq '^APP_KEY=$|^APP_KEY=base64:REPLACE_WITH_GENERATED_APP_KEY$' .env; then
        php artisan key:generate --force --ansi >/dev/null
    fi

    php artisan package:discover --ansi >/dev/null 2>&1 || true
fi

exec "$@"
