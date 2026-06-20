#!/bin/sh
mkdir -p /var/www/html/storage/app/public/avatars
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
chmod -R ug+rwX /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
php artisan storage:link --force 2>/dev/null || true
php artisan config:clear
php-fpm
