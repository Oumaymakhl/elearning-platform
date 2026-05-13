#!/bin/sh
cd /var/www/html
composer install --no-interaction --no-scripts --optimize-autoloader
php artisan key:generate --force
php artisan config:clear
php artisan route:clear
php-fpm
