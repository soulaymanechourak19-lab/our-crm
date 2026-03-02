#!/bin/bash
set -e

echo "⏳ Waiting for MySQL to be ready..."
MYSQL_HOST="${DB_HOST:-mysql}"
MYSQL_PORT="${DB_PORT:-3306}"
MAX_RETRIES=30
RETRY_COUNT=0

until mysqladmin ping -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"${DB_USERNAME:-root}" -p"${DB_PASSWORD:-root}" --silent 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "❌ MySQL did not become ready after $MAX_RETRIES attempts. Exiting."
        exit 1
    fi
    echo "   MySQL not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES) — retrying in 2s..."
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
