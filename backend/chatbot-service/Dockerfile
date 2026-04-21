FROM php:8.3-fpm
RUN apt-get update && apt-get install -y nginx curl && rm -rf /var/lib/apt/lists/*
WORKDIR /var/www/html
COPY . .
RUN chown -R www-data:www-data storage bootstrap/cache
COPY php-fpm.conf /usr/local/etc/php-fpm.d/zz-timeout.conf
COPY nginx.conf /etc/nginx/sites-available/default
EXPOSE 80
CMD service nginx start && php-fpm
