FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpng-dev libjpeg-dev libfreetype6-dev libpq-dev libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql zip gd intl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

RUN mkdir -p var/cache var/log /var/log/storycraft && chown -R www-data:www-data var/ /var/log/storycraft

EXPOSE 9000
CMD ["sh", "-c", "mkdir -p var/cache var/log && chown -R www-data:www-data var/ && php-fpm"]
