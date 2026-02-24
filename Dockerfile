FROM php:8.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    && docker-php-ext-install pdo_mysql opcache \
    && rm -rf /var/lib/apt/lists/*

# Configure OPcache for performance
RUN echo "opcache.enable=1\n\
    opcache.memory_consumption=128\n\
    opcache.interned_strings_buffer=8\n\
    opcache.max_accelerated_files=10000\n\
    opcache.revalidate_freq=0\n\
    opcache.validate_timestamps=1\n\
    opcache.fast_shutdown=1\n\
    opcache.enable_cli=1" > /usr/local/etc/php/conf.d/opcache.ini

# Enable Apache modules
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for better Docker layer caching
COPY backend/composer.json backend/composer.lock* /var/www/html/

# Install PHP dependencies (cached layer)
RUN composer install --no-interaction --no-scripts --no-autoloader

# Copy application files
COPY backend/ /var/www/html/

# Finish composer install (generate autoloader + run scripts)
RUN composer dump-autoload --optimize

# Fix Apache document root to point to public folder
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# Create .env file if it doesn't exist
RUN if [ ! -f .env ]; then cp .env.example .env; fi

# Generate application key
RUN php artisan key:generate

# Cache config and routes for performance
RUN php artisan config:cache || true
RUN php artisan route:cache || true

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache