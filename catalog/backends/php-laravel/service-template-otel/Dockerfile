FROM php:8.4-cli
RUN apt-get update && apt-get install -y unzip libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY composer.json composer.lock* ./
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-dev --optimize-autoloader
COPY . .
ENV OTEL_PHP_AUTOLOAD_ENABLED=true
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8080"]
