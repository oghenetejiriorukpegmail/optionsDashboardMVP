import { getDb } from './index';
import { Database } from 'sqlite';

// Stock Data Repository
export async function saveStockData(data: {
  ticker: string;
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}): Promise<void> {
  const db = await getDb();
  
  await db.run(
    `INSERT OR REPLACE INTO stock_data 
    (ticker, date, timestamp, open, high, low, close, volume)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.ticker,
      data.date,
      data.timestamp,
      data.open,
      data.high,
      data.low,
      data.close,
      data.volume
    ]
  );
}

export async function getStockData(ticker: string, days: number = 60): Promise<any[]> {
  const db = await getDb();
  const date = new Date();
  date.setDate(date.getDate() - days);
  const startDate = date.toISOString().split('T')[0];
  
  return db.all(
    `SELECT * FROM stock_data WHERE ticker = ? AND date >= ? ORDER BY timestamp ASC`,
    [ticker, startDate]
  );
}

// Technical Indicators Repository
export async function saveTechnicalIndicators(data: {
  ticker: string;
  date: string;
  timestamp: number;
  ema_10: number;
  ema_20: number;
  ema_50: number;
  rsi_14: number;
  stoch_rsi: number;
}): Promise<void> {
  const db = await getDb();
  
  await db.run(
    `INSERT OR REPLACE INTO technical_indicators 
    (ticker, date, timestamp, ema_10, ema_20, ema_50, rsi_14, stoch_rsi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.ticker,
      data.date,
      data.timestamp,
      data.ema_10,
      data.ema_20,
      data.ema_50,
      data.rsi_14,
      data.stoch_rsi
    ]
  );
}

export async function getTechnicalIndicators(ticker: string, days: number = 14): Promise<any[]> {
  const db = await getDb();
  const date = new Date();
  date.setDate(date.getDate() - days);
  const startDate = date.toISOString().split('T')[0];
  
  return db.all(
    `SELECT * FROM technical_indicators WHERE ticker = ? AND date >= ? ORDER BY timestamp ASC`,
    [ticker, startDate]
  );
}

// Options Data Repository
export async function saveOptionsData(data: {
  ticker: string;
  expiration_date: string;
  date: string;
  timestamp: number;
  strike_price: number;
  call_oi: number;
  put_oi: number;
  call_volume: number;
  put_volume: number;
  call_iv: number;
  put_iv: number;
  call_delta: number;
  put_delta: number;
  call_gamma: number;
  put_gamma: number;
}): Promise<void> {
  const db = await getDb();
  
  await db.run(
    `INSERT OR REPLACE INTO options_data 
    (ticker, expiration_date, date, timestamp, strike_price, call_oi, put_oi, call_volume, put_volume, call_iv, put_iv, call_delta, put_delta, call_gamma, put_gamma)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.ticker,
      data.expiration_date,
      data.date,
      data.timestamp,
      data.strike_price,
      data.call_oi,
      data.put_oi,
      data.call_volume,
      data.put_volume,
      data.call_iv,
      data.put_iv,
      data.call_delta,
      data.put_delta,
      data.call_gamma,
      data.put_gamma
    ]
  );
}

export async function getOptionsData(ticker: string, expiration_date?: string): Promise<any[]> {
  const db = await getDb();
  
  if (expiration_date) {
    return db.all(
      `SELECT * FROM options_data WHERE ticker = ? AND expiration_date = ? ORDER BY strike_price ASC`,
      [ticker, expiration_date]
    );
  }
  
  // Get most recent expiration date's data if no expiration specified
  const latestExpiration = await db.get(
    `SELECT expiration_date FROM options_data 
     WHERE ticker = ? 
     ORDER BY date(expiration_date) ASC 
     LIMIT 1`,
    [ticker]
  );
  
  if (!latestExpiration) return [];
  
  return db.all(
    `SELECT * FROM options_data 
     WHERE ticker = ? AND expiration_date = ? 
     ORDER BY strike_price ASC`,
    [ticker, latestExpiration.expiration_date]
  );
}

export async function getExpirationDates(ticker: string): Promise<string[]> {
  const db = await getDb();
  
  const result = await db.all(
    `SELECT DISTINCT expiration_date FROM options_data 
     WHERE ticker = ? 
     ORDER BY date(expiration_date) ASC`,
    [ticker]
  );
  
  return result.map(row => row.expiration_date);
}

// Market Sentiment Repository
export async function saveMarketSentiment(data: {
  ticker: string;
  date: string;
  timestamp: number;
  pcr: number;
  iv_percentile: number;
  max_pain: number;
  gamma_exposure: number;
}): Promise<void> {
  const db = await getDb();
  
  await db.run(
    `INSERT OR REPLACE INTO market_sentiment 
    (ticker, date, timestamp, pcr, iv_percentile, max_pain, gamma_exposure)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.ticker,
      data.date,
      data.timestamp,
      data.pcr,
      data.iv_percentile,
      data.max_pain,
      data.gamma_exposure
    ]
  );
}

export async function getMarketSentiment(ticker: string, days: number = 7): Promise<any[]> {
  const db = await getDb();
  const date = new Date();
  date.setDate(date.getDate() - days);
  const startDate = date.toISOString().split('T')[0];
  
  return db.all(
    `SELECT * FROM market_sentiment WHERE ticker = ? AND date >= ? ORDER BY timestamp ASC`,
    [ticker, startDate]
  );
}

// Trade Setups Repository
export async function saveTradeSetup(data: {
  ticker: string;
  date: string;
  timestamp: number;
  setup_type: string;
  strength: number;
  entry_price: number;
  stop_loss: number;
  target_price: number;
  risk_reward_ratio: number;
}): Promise<void> {
  const db = await getDb();
  
  await db.run(
    `INSERT OR REPLACE INTO trade_setups 
    (ticker, date, timestamp, setup_type, strength, entry_price, stop_loss, target_price, risk_reward_ratio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.ticker,
      data.date,
      data.timestamp,
      data.setup_type,
      data.strength,
      data.entry_price,
      data.stop_loss,
      data.target_price,
      data.risk_reward_ratio
    ]
  );
}

export async function getTradeSetups(ticker?: string, setup_type?: string): Promise<any[]> {
  const db = await getDb();
  
  let query = 'SELECT * FROM trade_setups';
  const params: any[] = [];
  
  if (ticker || setup_type) {
    query += ' WHERE';
    
    if (ticker) {
      query += ' ticker = ?';
      params.push(ticker);
      
      if (setup_type) {
        query += ' AND setup_type = ?';
        params.push(setup_type);
      }
    } else if (setup_type) {
      query += ' setup_type = ?';
      params.push(setup_type);
    }
  }
  
  query += ' ORDER BY date DESC, timestamp DESC';
  
  return db.all(query, params);
}

// Daily Summaries Repository
export async function saveDailySummary(data: {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema_10: number;
  ema_20: number;
  ema_50: number;
  rsi_14: number;
  stoch_rsi: number;
  pcr: number;
  iv_percentile: number;
  max_pain: number;
}): Promise<void> {
  const db = await getDb();
  
  await db.run(
    `INSERT OR REPLACE INTO daily_summaries 
    (ticker, date, open, high, low, close, volume, ema_10, ema_20, ema_50, rsi_14, stoch_rsi, pcr, iv_percentile, max_pain)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.ticker,
      data.date,
      data.open,
      data.high,
      data.low,
      data.close,
      data.volume,
      data.ema_10,
      data.ema_20,
      data.ema_50,
      data.rsi_14,
      data.stoch_rsi,
      data.pcr,
      data.iv_percentile,
      data.max_pain
    ]
  );
}

export async function getDailySummaries(ticker: string, days: number = 30): Promise<any[]> {
  const db = await getDb();
  const date = new Date();
  date.setDate(date.getDate() - days);
  const startDate = date.toISOString().split('T')[0];
  
  return db.all(
    `SELECT * FROM daily_summaries WHERE ticker = ? AND date >= ? ORDER BY date ASC`,
    [ticker, startDate]
  );
}

// Get tickers
export async function getAllTickers(): Promise<string[]> {
  const db = await getDb();
  
  const result = await db.all(`SELECT DISTINCT ticker FROM stock_data`);
  return result.map(row => row.ticker);
}

// Get latest stock price
export async function getLatestStockPrice(ticker: string): Promise<any> {
  const db = await getDb();
  
  return db.get(
    `SELECT * FROM stock_data 
     WHERE ticker = ? 
     ORDER BY timestamp DESC 
     LIMIT 1`,
    [ticker]
  );
}

// Get latest market context (price, technicals, sentiment)
export async function getLatestMarketContext(ticker: string): Promise<any> {
  const db = await getDb();
  
  const price = await db.get(
    `SELECT * FROM stock_data 
     WHERE ticker = ? 
     ORDER BY timestamp DESC 
     LIMIT 1`,
    [ticker]
  );
  
  const technicals = await db.get(
    `SELECT * FROM technical_indicators 
     WHERE ticker = ? 
     ORDER BY timestamp DESC 
     LIMIT 1`,
    [ticker]
  );
  
  const sentiment = await db.get(
    `SELECT * FROM market_sentiment 
     WHERE ticker = ? 
     ORDER BY timestamp DESC 
     LIMIT 1`,
    [ticker]
  );
  
  return {
    price,
    technicals,
    sentiment
  };
}
