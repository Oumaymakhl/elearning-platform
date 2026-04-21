# Étape 1 : Builder
FROM composer:2.6 as builder

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-interaction \
    --optimize-autoloader \
    --no-scripts \
    --ignore-platform-reqs \
    --no-dev

# Étape 2 : Application PHP
FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

WORKDIR /var/www/html

COPY --from=builder /app/vendor ./vendor

COPY . .

COPY .env.example .env

RUN chown -R www-data:www-data /var/www/html/storage
RUN chmod -R 775 /var/www/html/storage

RUN php artisan key:generate --no-interaction --force

EXPOSE 9000

CMD ["php-fpm"]
