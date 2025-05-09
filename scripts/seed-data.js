/**
 * Database seeding script
 * 
 * Run with: node scripts/seed-data.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'options_scanner.db');

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error('Database does not exist. Run npm run init-db first.');
  process.exit(1);
}

// Open database connection
const db = new sqlite3.Database(dbPath);

// Default tickers to seed
const TICKERS = ['TSLA', 'AAPL', 'AMZN', 'MSFT', 'NVDA', 'GOOGL'];

// Helper function to format date
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Helper function to generate random number in range
const randomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

// Seed stock data with realistic values
const seedStockData = async (ticker) => {
  console.log(`Seeding stock data for ${ticker}...`);
  
  // Generate 60 days of data
  const today = new Date();
  const prices = [];
  let price = ticker === 'TSLA' ? 250.0 : 
              ticker === 'AAPL' ? 180.0 :
              ticker === 'AMZN' ? 150.0 :
              ticker === 'MSFT' ? 400.0 :
              ticker === 'NVDA' ? 800.0 :
              ticker === 'GOOGL' ? 160.0 : 100.0;
  
  for (let i = 60; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const timestamp = Math.floor(date.getTime() / 1000);
    
    // Generate random day volatility
    const dayVolatility = randomInRange(0.01, 0.03);
    const open = price * (1 + randomInRange(-0.01, 0.01));
    const high = open * (1 + randomInRange(0, dayVolatility));
    const low = open * (1 - randomInRange(0, dayVolatility));
    const close = randomInRange(low, high);
    const volume = Math.floor(randomInRange(5000000, 20000000));
    
    // Simulate a trend
    if (i % 20 < 10) {
      price = close * (1 + randomInRange(0.001, 0.01)); // Uptrend
    } else {
      price = close * (1 - randomInRange(0.001, 0.008)); // Downtrend
    }
    
    prices.push({
      ticker,
      date: dateStr,
      timestamp,
      open,
      high,
      low,
      close,
      volume
    });
  }
  
  // Insert data into database
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO stock_data 
    (ticker, date, timestamp, open, high, low, close, volume)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const price of prices) {
    stmt.run(
      price.ticker,
      price.date,
      price.timestamp,
      price.open,
      price.high,
      price.low,
      price.close,
      price.volume
    );
  }
  
  stmt.finalize();
  console.log(`Stock data seeded for ${ticker}`);
  return prices;
};

// Calculate EMA from prices
const calculateEMA = (prices, period) => {
  const closes = prices.map(p => p.close);
  const emas = [];
  
  // Simple moving average for the first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  let ema = sum / period;
  emas.push(ema);
  
  // Calculate EMA for remaining prices
  const multiplier = 2 / (period + 1);
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
    emas.push(ema);
  }
  
  // Pad with nulls for the first period-1 values
  const padding = Array(period - 1).fill(null);
  return [...padding, ...emas];
};

// Calculate RSI
const calculateRSI = (prices, period = 14) => {
  const closes = prices.map(p => p.close);
  const gains = [];
  const losses = [];
  
  // Calculate price changes
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  const rsiValues = [];
  
  // Calculate RSI
  for (let i = period; i < closes.length; i++) {
    // Average gains and losses over period
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let j = i - period; j < i; j++) {
      avgGain += gains[j];
      avgLoss += losses[j];
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
  }
  
  // Pad with nulls for the first period values
  const padding = Array(period).fill(null);
  return [...padding, ...rsiValues];
};

// Calculate Stochastic RSI (simplified)
const calculateStochRSI = (rsiValues, period = 14) => {
  const stochRsiValues = [];
  
  for (let i = period * 2; i < rsiValues.length; i++) {
    const rsiSlice = rsiValues.slice(i - period, i);
    const validValues = rsiSlice.filter(v => v !== null);
    
    if (validValues.length === 0) {
      stochRsiValues.push(null);
      continue;
    }
    
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    
    // Calculate Stochastic RSI value
    if (max === min) {
      stochRsiValues.push(50);
    } else {
      const stochRsi = ((rsiValues[i] - min) / (max - min)) * 100;
      stochRsiValues.push(stochRsi);
    }
  }
  
  // Pad with nulls for the first 2*period values
  const padding = Array(period * 2).fill(null);
  return [...padding, ...stochRsiValues];
};

// Seed technical indicators
const seedTechnicalIndicators = async (ticker, prices) => {
  console.log(`Seeding technical indicators for ${ticker}...`);
  
  // Calculate EMAs
  const ema10 = calculateEMA(prices, 10);
  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  
  // Calculate RSI
  const rsiValues = calculateRSI(prices, 14);
  
  // Calculate Stochastic RSI
  const stochRsiValues = calculateStochRSI(rsiValues, 14);
  
  // Insert data into database
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO technical_indicators 
    (ticker, date, timestamp, ema_10, ema_20, ema_50, rsi_14, stoch_rsi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (let i = 0; i < prices.length; i++) {
    const price = prices[i];
    
    stmt.run(
      price.ticker,
      price.date,
      price.timestamp,
      ema10[i] || null,
      ema20[i] || null,
      ema50[i] || null,
      rsiValues[i] || null,
      stochRsiValues[i] || null
    );
  }
  
  stmt.finalize();
  console.log(`Technical indicators seeded for ${ticker}`);
};

// Seed options data
const seedOptionsData = async (ticker, prices) => {
  console.log(`Seeding options data for ${ticker}...`);
  
  // Get most recent price
  const latestPrice = prices[prices.length - 1];
  const currentPrice = latestPrice.close;
  
  // Generate expiration dates (weekly and monthly)
  const today = new Date();
  const expirationDates = [];
  
  // Next 4 weekly expirations (Fridays)
  for (let i = 0; i < 4; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + ((5 - date.getDay()) % 7) + (7 * i));
    expirationDates.push(formatDate(date));
  }
  
  // Monthly expirations (third Friday of next 3 months)
  for (let i = 1; i <= 3; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const day = (date.getDay() + 19) % 7;
    date.setDate(21 - day);
    expirationDates.push(formatDate(date));
  }
  
  // Generate strike prices (from -30% to +30% of current price)
  const strikes = [];
  const strikePriceStep = currentPrice * 0.05; // 5% spacing between strikes
  
  for (let pct = -0.3; pct <= 0.3; pct += 0.05) {
    const strike = Math.round(currentPrice * (1 + pct) / strikePriceStep) * strikePriceStep;
    strikes.push(strike);
  }
  
  // Generate options data for each expiration date
  for (const expirationDate of expirationDates) {
    // Calculate days to expiration
    const expDate = new Date(expirationDate);
    const dte = Math.max(1, Math.ceil((expDate - today) / (1000 * 60 * 60 * 24)));
    
    // Base implied volatility (higher for longer dates)
    const baseIv = 0.3 + (dte / 365) * 0.2;
    
    for (const strike of strikes) {
      // Higher IV for farther OTM options
      const distanceOtm = Math.abs(strike - currentPrice) / currentPrice;
      const ivSkew = 0.05 + distanceOtm * 0.5;
      
      // Call options data
      const callIv = baseIv + (strike > currentPrice ? ivSkew : 0);
      const putIv = baseIv + (strike < currentPrice ? ivSkew : 0);
      
      // Generate realistic Greeks
      const callDelta = Math.max(0, Math.min(1, 0.5 + 0.5 * (currentPrice - strike) / (currentPrice * callIv * Math.sqrt(dte / 365))));
      const putDelta = Math.max(0, Math.min(1, 0.5 + 0.5 * (strike - currentPrice) / (currentPrice * putIv * Math.sqrt(dte / 365))));
      
      const callGamma = (Math.exp(-0.5 * Math.pow((Math.log(currentPrice / strike) / (callIv * Math.sqrt(dte / 365))), 2)) / 
                       (currentPrice * callIv * Math.sqrt(dte / 365) * Math.sqrt(2 * Math.PI))) / 100;
      const putGamma = (Math.exp(-0.5 * Math.pow((Math.log(currentPrice / strike) / (putIv * Math.sqrt(dte / 365))), 2)) / 
                      (currentPrice * putIv * Math.sqrt(dte / 365) * Math.sqrt(2 * Math.PI))) / 100;
      
      // Open interest and volume (higher near the money)
      const atmFactor = Math.exp(-10 * Math.pow(distanceOtm, 2));
      
      const callOi = Math.floor(randomInRange(100, 5000) * atmFactor);
      const putOi = Math.floor(randomInRange(100, 5000) * atmFactor);
      const callVolume = Math.floor(callOi * randomInRange(0.1, 0.5));
      const putVolume = Math.floor(putOi * randomInRange(0.1, 0.5));
      
      // Insert data into database
      db.run(`
        INSERT OR REPLACE INTO options_data 
        (ticker, expiration_date, date, timestamp, strike_price, call_oi, put_oi, call_volume, put_volume, call_iv, put_iv, call_delta, put_delta, call_gamma, put_gamma)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ticker,
        expirationDate,
        latestPrice.date,
        latestPrice.timestamp,
        strike,
        callOi,
        putOi,
        callVolume,
        putVolume,
        callIv,
        putIv,
        callDelta,
        putDelta,
        callGamma,
        putGamma
      ]);
    }
  }
  
  console.log(`Options data seeded for ${ticker}`);
};

// Seed market sentiment
const seedMarketSentiment = async (ticker, prices) => {
  console.log(`Seeding market sentiment for ${ticker}...`);
  
  // Generate PCR, max pain, and gamma exposure for each day
  for (const price of prices) {
    // Generate put-call ratio (typically varies between 0.5 and 1.5)
    const pcr = randomInRange(0.5, 1.5);
    
    // Generate IV percentile (0-100)
    const ivPercentile = randomInRange(0, 100);
    
    // Max pain (near current price)
    const maxPain = price.close * (1 + randomInRange(-0.05, 0.05));
    
    // Gamma exposure (can be positive or negative)
    const gammaExposure = randomInRange(-2000000000, 2000000000);
    
    // Insert data into database
    db.run(`
      INSERT OR REPLACE INTO market_sentiment 
      (ticker, date, timestamp, pcr, iv_percentile, max_pain, gamma_exposure)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      ticker,
      price.date,
      price.timestamp,
      pcr,
      ivPercentile,
      maxPain,
      gammaExposure
    ]);
  }
  
  console.log(`Market sentiment seeded for ${ticker}`);
};

// Seed trade setups
const seedTradeSetups = async (ticker, prices) => {
  console.log(`Seeding trade setups for ${ticker}...`);
  
  // Get most recent price
  const latestPrice = prices[prices.length - 1];
  
  // Generate random setup type
  const setupTypes = ['bullish', 'bearish', 'neutral'];
  const setupType = setupTypes[Math.floor(Math.random() * setupTypes.length)];
  
  // Generate random strength (50-100)
  const strength = Math.floor(randomInRange(50, 100));
  
  // Calculate entry, target, and stop loss based on setup type
  let entryPrice = latestPrice.close;
  let targetPrice, stopLoss;
  
  if (setupType === 'bullish') {
    targetPrice = entryPrice * (1 + randomInRange(0.05, 0.15));
    stopLoss = entryPrice * (1 - randomInRange(0.03, 0.08));
  } else if (setupType === 'bearish') {
    targetPrice = entryPrice * (1 - randomInRange(0.05, 0.15));
    stopLoss = entryPrice * (1 + randomInRange(0.03, 0.08));
  } else {
    // Neutral setup
    targetPrice = entryPrice * (1 + randomInRange(-0.03, 0.03));
    stopLoss = entryPrice * (1 + (targetPrice > entryPrice ? 1 : -1) * randomInRange(0.05, 0.1));
  }
  
  // Calculate risk-reward ratio
  const riskRewardRatio = Math.abs(targetPrice - entryPrice) / Math.abs(stopLoss - entryPrice);
  
  // Insert data into database
  db.run(`
    INSERT OR REPLACE INTO trade_setups 
    (ticker, date, timestamp, setup_type, strength, entry_price, stop_loss, target_price, risk_reward_ratio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    ticker,
    latestPrice.date,
    latestPrice.timestamp,
    setupType,
    strength,
    entryPrice,
    stopLoss,
    targetPrice,
    riskRewardRatio
  ]);
  
  console.log(`Trade setup seeded for ${ticker}`);
};

// Seed daily summaries
const seedDailySummaries = async (ticker, prices) => {
  console.log(`Seeding daily summaries for ${ticker}...`);
  
  // Get technical indicators data
  db.each(`
    SELECT * FROM technical_indicators 
    WHERE ticker = ? 
    ORDER BY date DESC 
    LIMIT 30
  `, [ticker], (err, row) => {
    if (err) {
      console.error('Error fetching technical indicators:', err);
      return;
    }
    
    // Get matching price data
    const price = prices.find(p => p.date === row.date);
    if (!price) return;
    
    // Get market sentiment data
    db.get(`
      SELECT * FROM market_sentiment 
      WHERE ticker = ? AND date = ?
    `, [ticker, row.date], (err, sentiment) => {
      if (err || !sentiment) {
        console.error('Error fetching market sentiment:', err);
        return;
      }
      
      // Insert daily summary
      db.run(`
        INSERT OR REPLACE INTO daily_summaries 
        (ticker, date, open, high, low, close, volume, ema_10, ema_20, ema_50, rsi_14, stoch_rsi, pcr, iv_percentile, max_pain)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ticker,
        row.date,
        price.open,
        price.high,
        price.low,
        price.close,
        price.volume,
        row.ema_10,
        row.ema_20,
        row.ema_50,
        row.rsi_14,
        row.stoch_rsi,
        sentiment.pcr,
        sentiment.iv_percentile,
        sentiment.max_pain
      ]);
    });
  });
  
  console.log(`Daily summaries seeded for ${ticker}`);
};

// Main seeding function
const seedDatabase = async () => {
  console.log('Starting database seeding...');
  
  for (const ticker of TICKERS) {
    // Seed stock data
    const prices = await seedStockData(ticker);
    
    // Seed technical indicators
    await seedTechnicalIndicators(ticker, prices);
    
    // Seed options data
    await seedOptionsData(ticker, prices);
    
    // Seed market sentiment
    await seedMarketSentiment(ticker, prices);
    
    // Seed trade setups
    await seedTradeSetups(ticker, prices);
    
    // Seed daily summaries
    await seedDailySummaries(ticker, prices);
  }
  
  console.log('Database seeding completed');
  
  // Close database connection
  db.close(err => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
};

// Run the seeding function
seedDatabase().catch(err => {
  console.error('Error seeding database:', err);
  db.close();
});
