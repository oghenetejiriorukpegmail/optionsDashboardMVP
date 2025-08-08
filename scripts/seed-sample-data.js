#!/usr/bin/env node
/**
 * Seed sample data for testing
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'options_scanner.db');
const db = new sqlite3.Database(dbPath);

console.log('Seeding sample data for AMD...');

const now = Date.now();
const today = new Date().toISOString().split('T')[0];

db.serialize(() => {
  // Add technical indicators for AMD
  db.run(`
    INSERT OR REPLACE INTO technical_indicators 
    (ticker, date, timestamp, ema_10, ema_20, ema_50, rsi_14, stoch_rsi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, ['AMD', today, now, 163.12, 162.50, 160.75, 55.5, 62.3], (err) => {
    if (err) console.error('Error inserting technical indicators:', err);
    else console.log('✓ Technical indicators added');
  });

  // Add market sentiment for AMD
  db.run(`
    INSERT OR REPLACE INTO market_sentiment
    (ticker, date, timestamp, pcr, iv_percentile, max_pain, gamma_exposure)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, ['AMD', today, now, 0.75, 65, 165, 500000000], (err) => {
    if (err) console.error('Error inserting market sentiment:', err);
    else console.log('✓ Market sentiment added');
  });

  // Add stock data for AMD
  db.run(`
    INSERT OR REPLACE INTO stock_data
    (ticker, date, timestamp, open, high, low, close, volume)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, ['AMD', today, now, 165.05, 166.18, 157.80, 163.12, 131358221], (err) => {
    if (err) console.error('Error inserting stock data:', err);
    else console.log('✓ Stock data added');
  });

  // Add sample options data for AMD
  const expirationDate = '2025-08-15';
  const strikes = [155, 160, 163, 165, 170, 175];
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO options_data
    (ticker, expiration_date, date, timestamp, strike_price, 
     call_oi, put_oi, call_volume, put_volume, 
     call_iv, put_iv, call_delta, put_delta, call_gamma, put_gamma)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  strikes.forEach((strike, index) => {
    const callOI = Math.floor(Math.random() * 10000) + 1000;
    const putOI = Math.floor(Math.random() * 10000) + 1000;
    const callVolume = Math.floor(Math.random() * 5000) + 100;
    const putVolume = Math.floor(Math.random() * 5000) + 100;
    const callIV = 0.25 + Math.random() * 0.15;
    const putIV = 0.25 + Math.random() * 0.15;
    const callDelta = Math.max(0.1, 1 - (index * 0.15));
    const putDelta = -Math.max(0.1, index * 0.15);
    const callGamma = 0.01 + Math.random() * 0.05;
    const putGamma = 0.01 + Math.random() * 0.05;

    stmt.run(
      'AMD', expirationDate, today, now, strike,
      callOI, putOI, callVolume, putVolume,
      callIV, putIV, callDelta, putDelta, callGamma, putGamma
    );
  });

  stmt.finalize(() => {
    console.log('✓ Options data added for 6 strikes');
    
    // Verify the data
    db.all(`
      SELECT 
        (SELECT COUNT(*) FROM technical_indicators WHERE ticker = 'AMD') as tech_count,
        (SELECT COUNT(*) FROM market_sentiment WHERE ticker = 'AMD') as sentiment_count,
        (SELECT COUNT(*) FROM options_data WHERE ticker = 'AMD') as options_count,
        (SELECT COUNT(*) FROM stock_data WHERE ticker = 'AMD') as stock_count
    `, (err, rows) => {
      if (!err && rows[0]) {
        console.log('\nData verification:');
        console.log('- Technical indicators:', rows[0].tech_count);
        console.log('- Market sentiment:', rows[0].sentiment_count);
        console.log('- Options data:', rows[0].options_count);
        console.log('- Stock data:', rows[0].stock_count);
      }
      db.close();
    });
  });
});