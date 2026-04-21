FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    git curl libpng-dev oniguruma-dev libxml2-dev zip unzip nginx

WORKDIR /var/www/html
COPY . .
RUN chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
CMD ["php-fpm"]
