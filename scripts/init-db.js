/**
 * Initialize the database with tables
 * 
 * Run with: node scripts/init-db.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'options_scanner.db');

// Create and initialize database
const db = new sqlite3.Database(dbPath);

console.log(`Initializing database at ${dbPath}`);

// Create tables
db.serialize(() => {
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  // Stock price data table
  db.run(`
    CREATE TABLE IF NOT EXISTS stock_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      open REAL,
      high REAL,
      low REAL,
      close REAL,
      volume INTEGER,
      UNIQUE(ticker, timestamp)
    )
  `);
  
  // Technical indicators table
  db.run(`
    CREATE TABLE IF NOT EXISTS technical_indicators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      ema_10 REAL,
      ema_20 REAL,
      ema_50 REAL,
      rsi_14 REAL,
      stoch_rsi REAL,
      UNIQUE(ticker, timestamp)
    )
  `);
  
  // Options data table
  db.run(`
    CREATE TABLE IF NOT EXISTS options_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      expiration_date TEXT NOT NULL,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      strike_price REAL NOT NULL,
      call_oi INTEGER,
      put_oi INTEGER,
      call_volume INTEGER,
      put_volume INTEGER,
      call_iv REAL,
      put_iv REAL,
      call_delta REAL,
      put_delta REAL,
      call_gamma REAL,
      put_gamma REAL,
      UNIQUE(ticker, expiration_date, strike_price, timestamp)
    )
  `);
  
  // Market sentiment table
  db.run(`
    CREATE TABLE IF NOT EXISTS market_sentiment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      pcr REAL,
      iv_percentile REAL,
      max_pain REAL,
      gamma_exposure REAL,
      UNIQUE(ticker, timestamp)
    )
  `);
  
  // Trade setups table
  db.run(`
    CREATE TABLE IF NOT EXISTS trade_setups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      setup_type TEXT,
      strength INTEGER,
      entry_price REAL,
      stop_loss REAL,
      target_price REAL,
      risk_reward_ratio REAL,
      UNIQUE(ticker, timestamp)
    )
  `);
  
  // Daily summaries table for faster retrieval
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      date TEXT NOT NULL,
      open REAL,
      high REAL,
      low REAL,
      close REAL,
      volume INTEGER,
      ema_10 REAL,
      ema_20 REAL,
      ema_50 REAL,
      rsi_14 REAL,
      stoch_rsi REAL,
      pcr REAL,
      iv_percentile REAL,
      max_pain REAL,
      UNIQUE(ticker, date)
    )
  `);
  
  // Watchlist table
  db.run(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      setupType TEXT NOT NULL,
      price REAL NOT NULL,
      entryTarget REAL NOT NULL,
      stopLoss TEXT NOT NULL,
      targetPrice REAL NOT NULL,
      addedOn TEXT NOT NULL,
      notes TEXT,
      UNIQUE(symbol)
    )
  `);
  
  // Create indexes for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_stock_ticker_date ON stock_data(ticker, date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tech_ticker_date ON technical_indicators(ticker, date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_options_ticker_date ON options_data(ticker, date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sentiment_ticker_date ON market_sentiment(ticker, date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_setups_ticker_date ON trade_setups(ticker, date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_daily_ticker_date ON daily_summaries(ticker, date)`);
  
  console.log('Database tables and indexes created successfully');
});

// Close the database connection
db.close(err => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database initialization complete');
  }
});
