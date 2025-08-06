#!/bin/bash

# Docker initialization script
# This script prepares the database and starts the application

set -e

echo "🐳 Docker initialization starting..."

# Check if database exists, if not initialize it
DB_PATH="/app/data/options_scanner.db"

if [ ! -f "$DB_PATH" ]; then
    echo "📦 Database not found, initializing..."
    node /app/scripts/init-db.js
    echo "✅ Database initialized successfully"
else
    echo "📦 Database already exists at $DB_PATH"
fi

# Check database health
echo "🔍 Checking database health..."
if node -e "
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('$DB_PATH');
db.get('SELECT name FROM sqlite_master WHERE type=\"table\" LIMIT 1', (err, row) => {
  if (err) {
    console.error('Database health check failed:', err);
    process.exit(1);
  }
  console.log('✅ Database health check passed');
  db.close();
});
"; then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
    exit 1
fi

echo "🚀 Starting application..."
exec npm start