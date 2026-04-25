FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    git curl libpng-dev oniguruma-dev libxml2-dev zip unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY composer.json composer.lock ./
RUN composer install --no-interaction --optimize-autoloader --no-scripts --ignore-platform-reqs
COPY . .
COPY .env .env
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache
RUN sed -i 's/listen = 127.0.0.1:9000/listen = 0.0.0.0:9000/' /usr/local/etc/php-fpm.d/www.conf 2>/dev/null || true
CMD ["php-fpm"]
