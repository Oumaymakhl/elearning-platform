FROM php:8.2-fpm

# Installer les extensions
RUN apt-get update && apt-get install -y \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

WORKDIR /var/www/html

# Copier l'application
COPY . .

# Installer Composer globalement
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Installer les dépendances
RUN composer install --no-interaction --optimize-autoloader

# Permissions
RUN chown -R www-data:www-data storage
RUN chmod -R 775 storage

EXPOSE 9000

CMD ["php-fpm"]
