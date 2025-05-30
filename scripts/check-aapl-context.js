/**
 * Check AAPL market context data
 * 
 * Run with: node scripts/check-aapl-context.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'options_scanner.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking AAPL market context...\n');

// Get latest stock data
db.get(`
  SELECT * FROM stock_data 
  WHERE ticker = 'AAPL' 
  ORDER BY timestamp DESC 
  LIMIT 1
`, (err, stock) => {
  if (err) {
    console.error('Error getting stock data:', err);
  } else {
    console.log('Latest Stock Data:');
    console.log(stock);
  }
});

// Get latest technical indicators
db.get(`
  SELECT * FROM technical_indicators 
  WHERE ticker = 'AAPL' 
  ORDER BY timestamp DESC 
  LIMIT 1
`, (err, tech) => {
  if (err) {
    console.error('Error getting technical indicators:', err);
  } else {
    console.log('\nLatest Technical Indicators:');
    console.log(tech);
    
    if (tech) {
      // Check EMA trend
      if (tech.ema_10 > tech.ema_20 && tech.ema_20 > tech.ema_50) {
        console.log('  EMA Trend: Bullish (10 > 20 > 50)');
      } else if (tech.ema_10 < tech.ema_20 && tech.ema_20 < tech.ema_50) {
        console.log('  EMA Trend: Bearish (10 < 20 < 50)');
      } else {
        console.log('  EMA Trend: Mixed');
      }
      
      // Check RSI
      if (tech.rsi_14 >= 55 && tech.rsi_14 <= 80) {
        console.log('  RSI: Bullish range (55-80)');
      } else if (tech.rsi_14 >= 20 && tech.rsi_14 <= 45) {
        console.log('  RSI: Bearish range (20-45)');
      } else {
        console.log('  RSI: Neutral range');
      }
    }
  }
});

// Get latest market sentiment
db.get(`
  SELECT * FROM market_sentiment 
  WHERE ticker = 'AAPL' 
  ORDER BY timestamp DESC 
  LIMIT 1
`, (err, sentiment) => {
  if (err) {
    console.error('Error getting market sentiment:', err);
  } else {
    console.log('\nLatest Market Sentiment:');
    console.log(sentiment);
    
    if (sentiment) {
      // Check PCR
      console.log(`  PCR: ${sentiment.pcr} (Bullish < 0.8, Bearish > 1.2)`);
      console.log(`  IV Percentile: ${sentiment.iv_percentile}%`);
      console.log(`  Gamma Exposure: ${sentiment.gamma_exposure} (Bullish > 500M, Bearish < -500M)`);
    }
  }
});

// Get latest daily summary
db.get(`
  SELECT * FROM daily_summaries 
  WHERE ticker = 'AAPL' 
  ORDER BY date DESC 
  LIMIT 1
`, (err, summary) => {
  if (err) {
    console.error('Error getting daily summary:', err);
  } else {
    console.log('\nLatest Daily Summary:');
    console.log(summary);
  }
});

// Get sample options data
db.all(`
  SELECT * FROM options_data 
  WHERE ticker = 'AAPL' 
  ORDER BY timestamp DESC, strike_price ASC 
  LIMIT 10
`, (err, options) => {
  if (err) {
    console.error('Error getting options data:', err);
  } else {
    console.log('\nSample Options Data (10 strikes):');
    options.forEach(opt => {
      console.log(`  Strike: ${opt.strike_price}, Call OI: ${opt.call_oi}, Put OI: ${opt.put_oi}, Call Gamma: ${opt.call_gamma}`);
    });
  }
  
  // Close database
  setTimeout(() => {
    db.close();
  }, 1000);
});