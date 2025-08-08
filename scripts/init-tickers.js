#!/usr/bin/env node
/**
 * Initialize NASDAQ 100 tickers in the database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// NASDAQ 100 tickers
const nasdaq100Tickers = [
  'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'META', 'NVDA', 'TSLA', 'AVGO', 'COST',
  'PEP', 'ADBE', 'CSCO', 'TMUS', 'CMCSA', 'TXN', 'QCOM', 'AMGN', 'NFLX', 'INTC',
  'AMD', 'INTU', 'HON', 'SBUX', 'PYPL', 'MDLZ', 'ADI', 'AMAT', 'ISRG', 'GILD',
  'BKNG', 'ADP', 'REGN', 'VRTX', 'MRNA', 'ATVI', 'LRCX', 'PANW', 'ASML', 'MU',
  'KLAC', 'CHTR', 'MELI', 'CSX', 'SNPS', 'MAR', 'CDNS', 'ABNB', 'MNST', 'FTNT',
  'KDP', 'KHC', 'ORLY', 'DXCM', 'EXC', 'NXPI', 'ADSK', 'AEP', 'PAYX', 'ILMN',
  'CTAS', 'CRWD', 'EA', 'XEL', 'BIIB', 'WDAY', 'PCAR', 'IDXX', 'ROST', 'CEG',
  'MCHP', 'CPRT', 'ODFL', 'FAST', 'DDOG', 'VRSK', 'CTSH', 'PDD', 'DLTR', 'TEAM',
  'WBD', 'ANSS', 'GFS', 'EBAY', 'ZS', 'VRSN', 'SIRI', 'SPLK', 'SWKS', 'ALGN',
  'FANG', 'JD', 'CSGP', 'TTWO', 'NTAP', 'ZM', 'LCID', 'RIVN', 'MTCH', 'GEHC'
];

const dbPath = path.join(__dirname, '..', 'data', 'options_scanner.db');
const db = new sqlite3.Database(dbPath);

console.log('Initializing NASDAQ 100 tickers in database...');

db.serialize(() => {
  // Create a basic entry for each ticker in the daily_summaries table
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO daily_summaries (ticker, date, close, volume)
    VALUES (?, date('now'), 0, 0)
  `);

  let count = 0;
  nasdaq100Tickers.forEach(ticker => {
    stmt.run(ticker, (err) => {
      if (!err) {
        count++;
      }
    });
  });

  stmt.finalize(() => {
    console.log(`Initialized ${count} tickers in the database`);
    
    // Verify the tickers were added
    db.all('SELECT DISTINCT ticker FROM daily_summaries ORDER BY ticker', (err, rows) => {
      if (err) {
        console.error('Error verifying tickers:', err);
      } else {
        console.log(`Total tickers in database: ${rows.length}`);
        console.log('First 10 tickers:', rows.slice(0, 10).map(r => r.ticker).join(', '));
      }
      db.close();
    });
  });
});