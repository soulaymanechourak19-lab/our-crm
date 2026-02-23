#!/bin/bash
set -e

echo "⏳ Waiting for MySQL to be ready..."
MYSQL_HOST="${DB_HOST:-mysql}"
MYSQL_PORT="${DB_PORT:-3306}"
until (echo > /dev/tcp/"$MYSQL_HOST"/"$MYSQL_PORT") >/dev/null 2>&1; do
    echo "   MySQL not ready yet — retrying in 2s..."
    sleep 2
done
echo "✅ MySQL is ready."

cd /var/www/html

echo "🔧 Running migrations..."
php artisan migrate --force

echo "🌱 Running seeders (idempotent)..."
php artisan db:seed --force

echo "🚀 Caching config and routes..."
php artisan config:cache
php artisan route:cache

# Fix storage permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

echo "✅ Backend ready. Starting Apache..."
exec apache2-foreground
