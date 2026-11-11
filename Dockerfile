# syntax=docker/dockerfile:1

# ---- Stage 1: build frontend assets ----
FROM node:22-alpine AS assets
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY resources resources
COPY public public
COPY vite.config.js ./

# Frontend base paths (Vue Router base, API base, asset base) are baked in at
# build time from APP_PROJECT. Without it they default to "/" and the SPA breaks
# under a "/<project>/" sub-path. .env is not in the build context, so pass it in.
ARG APP_PROJECT=app
ENV APP_PROJECT=${APP_PROJECT}
RUN npm run build

# ---- Stage 2: PHP runtime ----
FROM php:8.2-fpm-bookworm

ARG UID=1000
ARG GID=1000

ENV ACCEPT_EULA=Y \
    COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /var/www/html

# Install runtime deps + build-time -dev headers, compile the PHP extensions,
# then purge the build-only packages so they don't bloat the final image.
# Trim the driver list (docker-php-ext-install / pecl) to only the databases
# you actually use to shrink this further.
RUN set -eux; \
    savedAptMark="$(apt-mark showmanual)"; \
    sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates curl gnupg unzip git \
        libcurl4-openssl-dev libfreetype6-dev libicu-dev libjpeg62-turbo-dev \
        libonig-dev libpng-dev libwebp-dev libxml2-dev libzip-dev libpq-dev \
        libsqlite3-dev unixodbc-dev; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/keyrings/microsoft.gpg; \
    echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends msodbcsql18; \
    docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp; \
    docker-php-ext-install -j"$(nproc)" \
        bcmath curl gd intl mbstring opcache pdo_pgsql pgsql pdo_mysql pdo_sqlite xml zip; \
    pecl install sqlsrv-5.12.0 pdo_sqlsrv-5.12.0; \
    docker-php-ext-enable sqlsrv pdo_sqlsrv; \
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer; \
    groupadd --gid "${GID}" laravel; \
    useradd --uid "${UID}" --gid laravel --shell /bin/bash --create-home laravel; \
    mkdir -p /var/www/.composer /var/www/html/storage /var/www/html/bootstrap/cache; \
    chown -R laravel:laravel /var/www /var/www/html; \
    # keep runtime deps that the compiled extensions link to; purge the rest
    apt-mark auto '.*' > /dev/null; \
    [ -z "$savedAptMark" ] || apt-mark manual $savedAptMark > /dev/null; \
    apt-mark manual msodbcsql18 ca-certificates git unzip > /dev/null; \
    find /usr/local/lib/php/extensions -name '*.so' -exec ldd '{}' ';' \
        | awk '/=>/ { so = $(NF-1); if (index(so, "/usr/local/") == 1) next; gsub("^/(usr/)?", "", so); printf "*%s\n", so }' \
        | sort -u \
        | xargs -r dpkg-query --search 2>/dev/null \
        | cut -d: -f1 \
        | sort -u \
        | xargs -r apt-mark manual > /dev/null; \
    apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/* /tmp/pear

COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-laravel.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/10-opcache.ini
COPY docker/php/entrypoint.sh /usr/local/bin/laravel-entrypoint
COPY --chown=laravel:laravel . /var/www/html
COPY --from=assets --chown=laravel:laravel /app/public/build /var/www/html/public/build

RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader \
    && sed -i 's/\r$//' /usr/local/bin/laravel-entrypoint \
    && chmod +x /usr/local/bin/laravel-entrypoint \
    && chown -R laravel:laravel /var/www/html/storage /var/www/html/bootstrap/cache

USER laravel

EXPOSE 9000

ENTRYPOINT ["laravel-entrypoint"]
CMD ["php-fpm"]
