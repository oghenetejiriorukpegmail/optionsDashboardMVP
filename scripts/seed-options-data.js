const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { open } = require('sqlite');

async function seedOptionsData() {
  const dbPath = path.join(__dirname, '..', 'data', 'scanner.db');
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  try {
    // Insert mock options data for AAPL to enable scanner functionality
    const ticker = 'AAPL';
    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
    
    const mockOptionsData = {
      ticker: ticker,
      date: now.toISOString().split('T')[0],
      timestamp: Math.floor(now.getTime() / 1000),
      expiration_date: expirationDate.toISOString().split('T')[0],
      days_to_expiry: 30,
      strike: 195.0, // Near current price
      option_type: 'call',
      bid: 5.25,
      ask: 5.35,
      last: 5.30,
      volume: 15000,
      open_interest: 25000,
      implied_volatility: 0.28,
      delta: 0.52,
      gamma: 0.015,
      theta: -0.08,
      vega: 0.12,
      rho: 0.05
    };
    
    // Insert call option
    await db.run(`
      INSERT OR REPLACE INTO options_data (
        ticker, date, timestamp, expiration_date, days_to_expiry, strike, 
        option_type, bid, ask, last, volume, open_interest, implied_volatility,
        delta, gamma, theta, vega, rho
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mockOptionsData.ticker,
      mockOptionsData.date,
      mockOptionsData.timestamp,
      mockOptionsData.expiration_date,
      mockOptionsData.days_to_expiry,
      mockOptionsData.strike,
      mockOptionsData.option_type,
      mockOptionsData.bid,
      mockOptionsData.ask,
      mockOptionsData.last,
      mockOptionsData.volume,
      mockOptionsData.open_interest,
      mockOptionsData.implied_volatility,
      mockOptionsData.delta,
      mockOptionsData.gamma,
      mockOptionsData.theta,
      mockOptionsData.vega,
      mockOptionsData.rho
    ]);
    
    // Insert put option
    const putOption = {
      ...mockOptionsData,
      option_type: 'put',
      delta: -0.48,
      bid: 4.85,
      ask: 4.95,
      last: 4.90
    };
    
    await db.run(`
      INSERT OR REPLACE INTO options_data (
        ticker, date, timestamp, expiration_date, days_to_expiry, strike, 
        option_type, bid, ask, last, volume, open_interest, implied_volatility,
        delta, gamma, theta, vega, rho
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      putOption.ticker,
      putOption.date,
      putOption.timestamp,
      putOption.expiration_date,
      putOption.days_to_expiry,
      putOption.strike,
      putOption.option_type,
      putOption.bid,
      putOption.ask,
      putOption.last,
      putOption.volume,
      putOption.open_interest,
      putOption.implied_volatility,
      putOption.delta,
      putOption.gamma,
      putOption.theta,
      putOption.vega,
      putOption.rho
    ]);
    
    console.log('Successfully seeded options data for AAPL');
    
    // Verify the data
    const result = await db.get('SELECT COUNT(*) as count FROM options_data WHERE ticker = ?', ['AAPL']);
    console.log(`Total options records for AAPL: ${result.count}`);
    
  } catch (error) {
    console.error('Error seeding options data:', error);
  } finally {
    await db.close();
  }
}

seedOptionsData().catch(console.error);