FROM composer:2 AS build
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress
COPY . .

FROM php:8.4-fpm-alpine
RUN apk add --no-cache libpng libjpeg-turbo freetype libzip libpq libintl icu-libs redis && \
    apk add --no-cache --virtual .build-deps $PHPIZE_DEPS libpng-dev libjpeg-turbo-dev freetype-dev libzip-dev libpq-dev icu-dev && \
    docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install pdo_pgsql zip gd intl && \
    pecl install redis && docker-php-ext-enable redis && \
    apk del .build-deps

WORKDIR /var/www/html
COPY --from=build /app /var/www/html

RUN mkdir -p var/cache var/log /var/log/storycraft && chown -R www-data:www-data var/ /var/log/storycraft

EXPOSE 9000
CMD ["sh", "-c", "mkdir -p var/cache var/log && chown -R www-data:www-data var/ && php-fpm"]
