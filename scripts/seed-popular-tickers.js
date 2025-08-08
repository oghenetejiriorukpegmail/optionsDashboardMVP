#!/usr/bin/env node
/**
 * Seed sample data for popular tickers
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'options_scanner.db');
const db = new sqlite3.Database(dbPath);

// Popular tickers to seed
const popularTickers = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META', 'TSLA', 'AMZN'];

console.log('Seeding sample data for popular tickers...');

const now = Date.now();
const today = new Date().toISOString().split('T')[0];

const tickerData = {
  AAPL: { price: 227.50, ema10: 226.80, ema20: 225.20, ema50: 222.10, rsi: 62.5, pcr: 0.68, iv: 45 },
  NVDA: { price: 132.50, ema10: 131.20, ema20: 130.50, ema50: 128.75, rsi: 58.2, pcr: 0.82, iv: 75 },
  MSFT: { price: 445.80, ema10: 444.20, ema20: 442.10, ema50: 438.90, rsi: 54.8, pcr: 0.72, iv: 35 },
  GOOGL: { price: 178.25, ema10: 177.50, ema20: 176.80, ema50: 175.20, rsi: 51.3, pcr: 0.79, iv: 40 },
  META: { price: 524.75, ema10: 523.20, ema20: 521.50, ema50: 518.30, rsi: 67.1, pcr: 0.65, iv: 55 },
  TSLA: { price: 248.50, ema10: 247.80, ema20: 246.20, ema50: 243.90, rsi: 49.7, pcr: 0.88, iv: 65 },
  AMZN: { price: 188.90, ema10: 188.20, ema20: 187.10, ema50: 185.50, rsi: 56.4, pcr: 0.74, iv: 42 }
};

db.serialize(() => {
  popularTickers.forEach(ticker => {
    const data = tickerData[ticker];
    
    // Add technical indicators
    db.run(`
      INSERT OR REPLACE INTO technical_indicators 
      (ticker, date, timestamp, ema_10, ema_20, ema_50, rsi_14, stoch_rsi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [ticker, today, now, data.ema10, data.ema20, data.ema50, data.rsi, data.rsi * 0.8]);

    // Add market sentiment
    db.run(`
      INSERT OR REPLACE INTO market_sentiment
      (ticker, date, timestamp, pcr, iv_percentile, max_pain, gamma_exposure)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [ticker, today, now, data.pcr, data.iv, data.price, 750000000]);

    // Add stock data
    db.run(`
      INSERT OR REPLACE INTO stock_data
      (ticker, date, timestamp, open, high, low, close, volume)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [ticker, today, now, data.price * 0.998, data.price * 1.015, data.price * 0.985, data.price, Math.floor(Math.random() * 100000000) + 10000000]);

    // Add options data - 5 strikes for each ticker
    const baseStrike = Math.floor(data.price / 5) * 5; // Round to nearest $5
    const strikes = [baseStrike - 10, baseStrike - 5, baseStrike, baseStrike + 5, baseStrike + 10];
    
    const expirationDate = '2025-08-15';
    
    strikes.forEach((strike, index) => {
      const callOI = Math.floor(Math.random() * 15000) + 2000;
      const putOI = Math.floor(Math.random() * 15000) + 2000;
      const callVolume = Math.floor(Math.random() * 8000) + 200;
      const putVolume = Math.floor(Math.random() * 8000) + 200;
      const callIV = 0.20 + Math.random() * 0.25;
      const putIV = 0.20 + Math.random() * 0.25;
      const callDelta = Math.max(0.05, 0.9 - (index * 0.2));
      const putDelta = -Math.max(0.05, 0.1 + (index * 0.2));
      const callGamma = 0.008 + Math.random() * 0.06;
      const putGamma = 0.008 + Math.random() * 0.06;

      db.run(`
        INSERT OR REPLACE INTO options_data
        (ticker, expiration_date, date, timestamp, strike_price, 
         call_oi, put_oi, call_volume, put_volume, 
         call_iv, put_iv, call_delta, put_delta, call_gamma, put_gamma)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ticker, expirationDate, today, now, strike,
        callOI, putOI, callVolume, putVolume,
        callIV, putIV, callDelta, putDelta, callGamma, putGamma
      ]);
    });

    console.log(`✓ Data seeded for ${ticker} (Price: $${data.price})`);
  });

  // Verify the data after seeding
  setTimeout(() => {
    db.all(`
      SELECT ticker, COUNT(*) as count FROM (
        SELECT ticker FROM technical_indicators WHERE ticker IN ('AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META', 'TSLA', 'AMZN')
        UNION ALL
        SELECT ticker FROM market_sentiment WHERE ticker IN ('AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META', 'TSLA', 'AMZN')
        UNION ALL 
        SELECT ticker FROM options_data WHERE ticker IN ('AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META', 'TSLA', 'AMZN')
        UNION ALL
        SELECT ticker FROM stock_data WHERE ticker IN ('AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META', 'TSLA', 'AMZN')
      ) GROUP BY ticker ORDER BY ticker
    `, (err, rows) => {
      if (!err) {
        console.log('\nData verification:');
        rows.forEach(row => {
          console.log(`- ${row.ticker}: ${row.count} records`);
        });
      }
      db.close();
    });
  }, 1000);
});