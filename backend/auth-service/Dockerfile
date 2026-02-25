# Étape 1 : Builder
FROM composer:2.6 as builder

WORKDIR /app

# Copier les fichiers composer
COPY composer.json composer.lock ./

# Installer les dépendances sans scripts
RUN composer install \
    --no-interaction \
    --optimize-autoloader \
    --no-scripts \
    --ignore-platform-reqs \
    --no-dev

# Étape 2 : Application PHP
FROM php:8.2-fpm

# Installer les extensions nécessaires
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Définir le répertoire de travail
WORKDIR /var/www/html

# Copier les dépendances depuis le builder
COPY --from=builder /app/vendor ./vendor

# Copier l'application Laravel
COPY . .

# Copier le fichier .env
COPY .env.example .env

# Définir les permissions
RUN chown -R www-data:www-data /var/www/html/storage
RUN chmod -R 775 /var/www/html/storage

# Générer la clé Laravel
RUN php artisan key:generate --force

EXPOSE 9000

CMD ["php-fpm"]
