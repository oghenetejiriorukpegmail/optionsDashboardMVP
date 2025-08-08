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
    
    echo "📊 Seeding historical data..."
    node /app/scripts/seed-data.js
    echo "✅ Historical data seeded successfully"
else
    echo "📦 Database already exists at $DB_PATH"
    
    # Check if database has sufficient historical data
    DATA_COUNT=$(node -e "
    const sqlite3 = require('sqlite3');
    const db = new sqlite3.Database('$DB_PATH');
    db.get('SELECT COUNT(*) as count FROM stock_data WHERE ticker = \"AAPL\"', (err, row) => {
      if (err) {
        console.log('0');
        process.exit(0);
      }
      console.log(row.count);
      db.close();
    });
    ")
    
    if [ "$DATA_COUNT" -lt "100" ]; then
        echo "📊 Insufficient historical data ($DATA_COUNT entries), reseeding..."
        node /app/scripts/seed-data.js
        echo "✅ Historical data reseeded successfully"
    else
        echo "✅ Database has sufficient historical data ($DATA_COUNT entries)"
    fi
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