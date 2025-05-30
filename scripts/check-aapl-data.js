/**
 * Check if AAPL data exists in the database
 * 
 * Run with: node scripts/check-aapl-data.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'options_scanner.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking AAPL data in the database...\n');

// Check quotes/stock_data table
db.get(`
  SELECT COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date 
  FROM stock_data 
  WHERE ticker = 'AAPL'
`, (err, row) => {
  if (err) {
    console.error('Error querying stock_data:', err);
  } else {
    console.log('Stock Data (quotes):');
    console.log(`  Records: ${row.count}`);
    console.log(`  Date range: ${row.min_date} to ${row.max_date}`);
  }
});

// Check historical_data (daily_summaries table)
db.get(`
  SELECT COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date 
  FROM daily_summaries 
  WHERE ticker = 'AAPL'
`, (err, row) => {
  if (err) {
    console.error('Error querying daily_summaries:', err);
  } else {
    console.log('\nHistorical Data (daily_summaries):');
    console.log(`  Records: ${row.count}`);
    console.log(`  Date range: ${row.min_date || 'No data'} to ${row.max_date || 'No data'}`);
  }
});

// Check technical_indicators table
db.get(`
  SELECT COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date 
  FROM technical_indicators 
  WHERE ticker = 'AAPL'
`, (err, row) => {
  if (err) {
    console.error('Error querying technical_indicators:', err);
  } else {
    console.log('\nTechnical Indicators:');
    console.log(`  Records: ${row.count}`);
    console.log(`  Date range: ${row.min_date} to ${row.max_date}`);
  }
});

// Check options_data table
db.get(`
  SELECT COUNT(*) as count, COUNT(DISTINCT expiration_date) as expirations 
  FROM options_data 
  WHERE ticker = 'AAPL'
`, (err, row) => {
  if (err) {
    console.error('Error querying options_data:', err);
  } else {
    console.log('\nOptions Data:');
    console.log(`  Records: ${row.count}`);
    console.log(`  Unique expiration dates: ${row.expirations}`);
  }
});

// Check market_sentiment table
db.get(`
  SELECT COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date 
  FROM market_sentiment 
  WHERE ticker = 'AAPL'
`, (err, row) => {
  if (err) {
    console.error('Error querying market_sentiment:', err);
  } else {
    console.log('\nMarket Sentiment:');
    console.log(`  Records: ${row.count}`);
    console.log(`  Date range: ${row.min_date} to ${row.max_date}`);
  }
});

// Check trade_setups table
db.get(`
  SELECT COUNT(*) as count, setup_type, strength 
  FROM trade_setups 
  WHERE ticker = 'AAPL'
  GROUP BY setup_type
`, (err, row) => {
  if (err) {
    console.error('Error querying trade_setups:', err);
  } else {
    console.log('\nTrade Setups:');
    if (row) {
      console.log(`  ${row.setup_type}: ${row.count} record(s), strength: ${row.strength}`);
    } else {
      console.log('  No trade setups found');
    }
  }
});

// List all tickers with data
console.log('\n\nAll tickers with data:');
db.all(`
  SELECT DISTINCT ticker 
  FROM stock_data 
  ORDER BY ticker
`, (err, rows) => {
  if (err) {
    console.error('Error listing tickers:', err);
  } else {
    rows.forEach(row => {
      console.log(`  - ${row.ticker}`);
    });
  }
  
  // Close database
  db.close();
});