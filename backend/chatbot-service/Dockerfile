FROM php:8.4-fpm-alpine3.21
RUN apk add --no-cache \
    git curl libpng-dev oniguruma-dev libxml2-dev zip unzip nginx
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --optimize-autoloader
RUN chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
RUN php artisan migrate --force 2>/dev/null || true
CMD ["php-fpm"]
