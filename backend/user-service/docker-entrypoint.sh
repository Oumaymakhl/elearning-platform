#!/bin/sh
php artisan storage:link --force 2>/dev/null || true
php artisan config:clear
php-fpm
