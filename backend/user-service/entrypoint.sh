#!/bin/sh
set -e

# Si le fichier .env n'existe pas ou si APP_KEY est vide, on génère la clé
if [ ! -f .env ] || ! grep -q "^APP_KEY=" .env; then
    echo "Génération de la clé d'application..."
    php artisan key:generate --no-interaction
fi

# Lancer PHP-FPM
exec php-fpm
