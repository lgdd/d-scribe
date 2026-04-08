FROM php:8.4-cli
RUN apt-get update && apt-get install -y unzip libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && curl -LO https://github.com/DataDog/dd-trace-php/releases/latest/download/datadog-setup.php \
    && php datadog-setup.php --php-bin=all \
    && rm datadog-setup.php && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY composer.json composer.lock* ./
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-dev --optimize-autoloader
COPY . .
ENV DD_LOGS_INJECTION=true
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8080"]
