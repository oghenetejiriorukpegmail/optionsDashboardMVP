import axios from 'axios';
import * as talib from 'ta-lib';
import { SCANNER_CONFIG, TECHNICAL_INDICATOR_CONFIG } from '@/lib/config';
import { cachedFetch, cacheManager } from './cacheManager';

// Types for Yahoo Finance API responses
interface YahooQuote {
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketPrice: number;
  regularMarketVolume: number;
  regularMarketTime: number;
}

interface YahooOptionChain {
  expirationDates: number[];
  strikes: number[];
  calls: YahooOption[];
  puts: YahooOption[];
}

interface YahooOption {
  contractSymbol: string;
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  change: number;
  percentChange: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  inTheMoney: boolean;
  contractSize: string;
  currency: string;
  expiration: number;
  lastTradeDate: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

interface YahooHistoricalData {
  date: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  adjclose: number[];
}

// Base URL for Yahoo Finance API
const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com';
const YAHOO_FINANCE_API = {
  QUOTE: `${YAHOO_FINANCE_BASE_URL}/v7/finance/quote`,
  OPTIONS: `${YAHOO_FINANCE_BASE_URL}/v7/finance/options`,
  HISTORY: `${YAHOO_FINANCE_BASE_URL}/v8/finance/chart`,
};

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get configuration from config file
const API_RETRY_ATTEMPTS = SCANNER_CONFIG.API.RETRY_ATTEMPTS;
const API_RETRY_DELAY = SCANNER_CONFIG.API.RETRY_DELAY;

// Default headers to avoid 401 Unauthorized errors
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Referer': 'https://finance.yahoo.com',
};

// Helper function to format date to YYYY-MM-DD
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
};

// Cache TTLs for different data types
const CACHE_TTLS = {
  QUOTE: 10 * 1000, // 10 seconds
  HISTORICAL: 60 * 60 * 1000, // 1 hour
  OPTIONS: 5 * 60 * 1000, // 5 minutes
  TECHNICAL: 60 * 60 * 1000, // 1 hour
};

/**
 * Fetch data from Yahoo Finance API with retries and exponential backoff
 */
async function fetchYahooFinanceApi<T>(url: string, params?: any): Promise<T> {
  let attempts = 0;
  
  while (attempts < API_RETRY_ATTEMPTS) {
    try {
      const response = await axios.get(url, {
        params,
        headers: DEFAULT_HEADERS,
      });
      
      return response.data;
    } catch (error: any) {
      attempts++;
      console.error(`Error fetching from Yahoo Finance API (attempt ${attempts}/${API_RETRY_ATTEMPTS}):`, error.message || error);
      
      // If we got a 429 (Too Many Requests) status code, wait longer
      if (error.response && error.response.status === 429) {
        const backoffTime = Math.min(API_RETRY_DELAY * Math.pow(2, attempts), 10000);
        console.log(`Rate limited. Backing off for ${backoffTime}ms before retry.`);
        await delay(backoffTime);
      } else {
        // For other errors, use standard delay between retries
        if (attempts < API_RETRY_ATTEMPTS) {
          await delay(API_RETRY_DELAY);
        }
      }
      
      if (attempts >= API_RETRY_ATTEMPTS) {
        throw new Error(`Failed after ${API_RETRY_ATTEMPTS} attempts: ${error.message || error}`);
      }
    }
  }
  
  throw new Error(`Failed after ${API_RETRY_ATTEMPTS} attempts`);
}

/**
 * Get current stock quote with caching
 */
export async function getQuote(ticker: string): Promise<{
  ticker: string;
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
} | null> {
  const cacheKey = `quote:${ticker}`;
  
  return cachedFetch(
    cacheKey,
    async () => {
      console.log(`Fetching quote for ${ticker} from API...`);
      
      const data = await fetchYahooFinanceApi<any>(YAHOO_FINANCE_API.QUOTE, {
        symbols: ticker,
        formatted: false,
      });
      
      const quoteData = data.quoteResponse.result[0] as YahooQuote;
      
      if (!quoteData) {
        console.error(`No quote data found for ${ticker}`);
        return null;
      }
      
      return {
        ticker,
        date: formatDate(quoteData.regularMarketTime),
        timestamp: quoteData.regularMarketTime,
        open: quoteData.regularMarketOpen,
        high: quoteData.regularMarketDayHigh,
        low: quoteData.regularMarketDayLow,
        close: quoteData.regularMarketPrice,
        volume: quoteData.regularMarketVolume,
      };
    },
    {
      ttl: CACHE_TTLS.QUOTE,
      staleWhileRevalidate: true,
      checkFreshness: (data) => {
        // Check if data was fetched in the last 60 seconds during market hours
        const now = new Date();
        const marketOpen = now.getHours() >= 9 && now.getHours() < 16;
        return marketOpen ? (Date.now() - data.timestamp * 1000) < 60000 : true;
      }
    }
  );
}

/**
 * Get historical data with caching
 */
export async function getHistoricalData(
  ticker: string,
  period = '3mo',
  interval = '1d'
): Promise<{
  dates: string[];
  timestamps: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  adjclose: number[];
} | null> {
  const cacheKey = `historical:${ticker}:${period}:${interval}`;
  
  return cachedFetch(
    cacheKey,
    async () => {
      console.log(`Fetching historical data for ${ticker} from API...`);
      
      const data = await fetchYahooFinanceApi<any>(`${YAHOO_FINANCE_API.HISTORY}/${ticker}`, {
        period,
        interval,
        includePrePost: false,
        events: 'div,split',
      });
      
      const result = data.chart.result[0];
      if (!result) {
        console.error(`No historical data found for ${ticker}`);
        return null;
      }
      
      const timestamps = result.timestamp;
      const dates = timestamps.map(formatDate);
      const { open, high, low, close, volume } = result.indicators.quote[0];
      const { adjclose } = result.indicators.adjclose[0];
      
      return {
        dates,
        timestamps,
        open,
        high,
        low,
        close,
        volume,
        adjclose,
      };
    },
    {
      ttl: CACHE_TTLS.HISTORICAL,
      staleWhileRevalidate: true,
    }
  );
}

/**
 * Get options chain with caching
 */
export async function getOptionsChain(ticker: string, expirationTimestamp?: number): Promise<{
  ticker: string;
  expirationDates: string[];
  currentExpirationDate: string;
  strikes: number[];
  calls: YahooOption[];
  puts: YahooOption[];
} | null> {
  const cacheKey = `options:${ticker}${expirationTimestamp ? `:${expirationTimestamp}` : ''}`;
  
  return cachedFetch(
    cacheKey,
    async () => {
      console.log(`Fetching options chain for ${ticker} from API...`);
      
      let url = `${YAHOO_FINANCE_API.OPTIONS}/${ticker}`;
      let params = {};
      
      if (expirationTimestamp) {
        params = { date: expirationTimestamp };
      }
      
      const data = await fetchYahooFinanceApi<any>(url, params);
      
      const optionChain = data.optionChain.result[0] as YahooOptionChain;
      
      if (!optionChain) {
        console.error(`No options chain found for ${ticker}`);
        return null;
      }
      
      // Format expiration dates
      const expirationDates = optionChain.expirationDates.map(formatDate);
      
      return {
        ticker,
        expirationDates,
        currentExpirationDate: formatDate(optionChain.expirationDates[0]),
        strikes: optionChain.strikes,
        calls: optionChain.calls,
        puts: optionChain.puts,
      };
    },
    {
      ttl: CACHE_TTLS.OPTIONS,
      staleWhileRevalidate: true,
    }
  );
}

/**
 * Calculate technical indicators with caching
 */
export function calculateTechnicalIndicators(historicalData: {
  close: number[];
  high: number[];
  low: number[];
}): {
  ema10: number[];
  ema20: number[];
  ema50: number[];
  rsi14: number[];
  stochRsi: number[];
} {
  // Generate a cache key based on the input data
  const dataHash = JSON.stringify({
    close: historicalData.close.slice(-50), // Only use last 50 points for hash
    timestamp: Math.floor(Date.now() / CACHE_TTLS.TECHNICAL)
  });
  const cacheKey = `technicals:${dataHash}`;
  
  // Check cache first
  const cachedResult = cacheManager.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    // EMA calculations
    const ema10 = talib.EMA(historicalData.close, TECHNICAL_INDICATOR_CONFIG.EMA_PERIODS.SHORT);
    const ema20 = talib.EMA(historicalData.close, TECHNICAL_INDICATOR_CONFIG.EMA_PERIODS.MEDIUM);
    const ema50 = talib.EMA(historicalData.close, TECHNICAL_INDICATOR_CONFIG.EMA_PERIODS.LONG);
    
    // RSI calculation
    const rsi14 = talib.RSI(historicalData.close, TECHNICAL_INDICATOR_CONFIG.RSI_PERIOD);
    
    // Stochastic RSI calculation (simplified)
    const rsiPeriod = TECHNICAL_INDICATOR_CONFIG.STOCH_RSI_PERIOD;
    const stochPeriod = 14;
    const kPeriod = 3;
    const dPeriod = 3;
    
    // Calculate RSI for Stochastic RSI
    const rsiValues = talib.RSI(historicalData.close, rsiPeriod);
    
    // Calculate Stochastic of RSI
    const stochRsi = [];
    for (let i = stochPeriod - 1; i < rsiValues.length; i++) {
      const rsiSlice = rsiValues.slice(i - stochPeriod + 1, i + 1);
      const min = Math.min(...rsiSlice);
      const max = Math.max(...rsiSlice);
      
      // K value calculation
      const k = (rsiValues[i] - min) / (max - min) * 100;
      stochRsi.push(k);
    }
    
    // Fill beginning with NaN to match length
    const padding = Array(historicalData.close.length - stochRsi.length).fill(NaN);
    
    const result = {
      ema10,
      ema20,
      ema50,
      rsi14,
      stochRsi: [...padding, ...stochRsi],
    };
    
    // Cache the result
    cacheManager.set(cacheKey, result, { ttl: CACHE_TTLS.TECHNICAL });
    
    return result;
  } catch (error) {
    console.error('Error calculating technical indicators:', error);
    return {
      ema10: [],
      ema20: [],
      ema50: [],
      rsi14: [],
      stochRsi: [],
    };
  }
}

/**
 * Calculate options-based metrics with caching
 */
export function calculateOptionsMetrics(
  calls: YahooOption[], 
  puts: YahooOption[], 
  currentPrice: number
): {
  pcr: number;
  maxPain: number;
  totalCallOi: number;
  totalPutOi: number;
  totalCallVolume: number;
  totalPutVolume: number;
  vwiv: number;
  gammaExposure: number;
} {
  // Generate a cache key based on the input data
  const dataHash = JSON.stringify({
    callsOi: calls.reduce((sum, call) => sum + call.openInterest, 0),
    putsOi: puts.reduce((sum, put) => sum + put.openInterest, 0),
    price: currentPrice,
    timestamp: Math.floor(Date.now() / (5 * 60 * 1000)) // 5 minute granularity
  });
  const cacheKey = `options_metrics:${dataHash}`;
  
  // Check cache first
  const cachedResult = cacheManager.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Put-Call Ratio calculation
  const totalCallOi = calls.reduce((sum, option) => sum + option.openInterest, 0);
  const totalPutOi = puts.reduce((sum, option) => sum + option.openInterest, 0);
  const pcr = totalPutOi / totalCallOi;
  
  const totalCallVolume = calls.reduce((sum, option) => sum + option.volume, 0);
  const totalPutVolume = puts.reduce((sum, option) => sum + option.volume, 0);
  
  // Max Pain calculation
  const strikes = [...new Set([...calls, ...puts].map(option => option.strike))].sort((a, b) => a - b);
  
  let minPain = Infinity;
  let maxPainStrike = 0;
  
  for (const strike of strikes) {
    let totalPain = 0;
    
    // Calculate pain for call options
    for (const call of calls) {
      if (strike < call.strike) {
        // Out of the money, no pain
        continue;
      }
      // In the money, calculate pain
      totalPain += call.openInterest * (strike - call.strike);
    }
    
    // Calculate pain for put options
    for (const put of puts) {
      if (strike > put.strike) {
        // Out of the money, no pain
        continue;
      }
      // In the money, calculate pain
      totalPain += put.openInterest * (put.strike - strike);
    }
    
    if (totalPain < minPain) {
      minPain = totalPain;
      maxPainStrike = strike;
    }
  }
  
  // Volume-Weighted Implied Volatility (VWIV)
  const totalCallVolWeight = calls.reduce((sum, option) => sum + (option.volume * option.impliedVolatility), 0);
  const totalPutVolWeight = puts.reduce((sum, option) => sum + (option.volume * option.impliedVolatility), 0);
  const vwiv = (totalCallVolWeight + totalPutVolWeight) / (totalCallVolume + totalPutVolume || 1);
  
  // Simplified Gamma Exposure calculation (approximation)
  const callGamma = calls.reduce((sum, option) => {
    // Only include options with delta and gamma data
    if (option.delta && option.gamma) {
      return sum + (option.openInterest * option.gamma * 100 * currentPrice);
    }
    return sum;
  }, 0);
  
  const putGamma = puts.reduce((sum, option) => {
    // Only include options with delta and gamma data
    if (option.delta && option.gamma) {
      return sum - (option.openInterest * option.gamma * 100 * currentPrice);
    }
    return sum;
  }, 0);
  
  const gammaExposure = callGamma + putGamma;
  
  const result = {
    pcr,
    maxPain: maxPainStrike,
    totalCallOi,
    totalPutOi,
    totalCallVolume,
    totalPutVolume,
    vwiv,
    gammaExposure,
  };
  
  // Cache the result
  cacheManager.set(cacheKey, result, { ttl: CACHE_TTLS.OPTIONS });
  
  return result;
}

/**
 * Calculate IV percentile based on historical IV data
 */
export function calculateIvPercentile(currentIv: number, historicalIvs: number[]): number {
  const sortedIvs = [...historicalIvs].sort((a, b) => a - b);
  const position = sortedIvs.findIndex(iv => iv >= currentIv);
  return position / sortedIvs.length * 100;
}

/**
 * Get cache stats for monitoring
 */
export function getCacheStats() {
  return cacheManager.getStats();
}

/**
 * Clear all cache
 */
export function clearCache() {
  cacheManager.clear();
}