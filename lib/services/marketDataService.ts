import axios from 'axios';
import * as talib from 'ta-lib';
import { SCANNER_CONFIG } from '@/lib/config';
import { cachedFetch, cacheManager } from './cacheManager';
import { callAlphaVantageApi } from '../api/alphavantage/client';
import { getQuote as getAlphaVantageQuote, getHistoricalData as getAlphaVantageHistory } from '../api/alphavantage/stocks';
import { polygonRateLimiter, alphaVantageRateLimiter, twelveDataRateLimiter, globalRateLimiter } from '../utils/rateLimiter';
import { getSymbolForAPI, isVolatilityIndex } from '../config/special-symbols';
import { ibkrClient, initializeIBKR } from './ibkrClient';
import { calculateTechnicalIndicators, calculateOptionsMetrics, calculateIvPercentile } from './yahooFinance';
import { createContextLogger } from '../utils/logger';

const logger = createContextLogger('MarketDataService');

// Types
interface MarketQuote {
  ticker: string;
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface HistoricalData {
  dates: string[];
  timestamps: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  adjclose: number[];
}

// Cache TTLs
const CACHE_TTLS = {
  QUOTE: 60 * 1000, // 1 minute for real-time quotes
  HISTORICAL: 60 * 60 * 1000, // 1 hour
  OPTIONS: 15 * 60 * 1000, // 15 minutes
};

// API Configuration
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '';
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

// Polygon.io configuration
const POLYGON_API_KEY = process.env.POLYGON_API_KEY || '';
const POLYGON_BASE_URL = 'https://api.polygon.io';

/**
 * Get quote from Twelve Data API (800 calls/day free)
 */
async function getTwelveDataQuote(ticker: string): Promise<MarketQuote | null> {
  if (!TWELVE_DATA_API_KEY) {
    throw new Error('Twelve Data API key not configured');
  }

  // Apply rate limiting
  await twelveDataRateLimiter.waitIfNeeded();
  await globalRateLimiter.waitIfNeeded();

  try {
    // Use special symbol mapping if needed
    const apiSymbol = getSymbolForAPI(ticker, 'twelveData');
    
    const response = await axios.get(`${TWELVE_DATA_BASE_URL}/quote`, {
      params: {
        symbol: apiSymbol,
        apikey: TWELVE_DATA_API_KEY,
      },
    });

    const data = response.data;
    if (data.status === 'error') {
      throw new Error(data.message || 'Twelve Data API error');
    }

    return {
      ticker,
      date: new Date().toISOString().split('T')[0],
      timestamp: Math.floor(Date.now() / 1000),
      open: parseFloat(data.open),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      close: parseFloat(data.close),
      volume: parseInt(data.volume),
    };
  } catch (error) {
    logger.error(`Twelve Data quote error for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get quote from Polygon.io API (5 calls/minute free)
 */
async function getPolygonQuote(ticker: string): Promise<MarketQuote | null> {
  if (!POLYGON_API_KEY) {
    throw new Error('Polygon API key not configured');
  }

  // Apply rate limiting
  await polygonRateLimiter.waitIfNeeded();
  await globalRateLimiter.waitIfNeeded();

  try {
    // Use special symbol mapping if needed
    const apiSymbol = getSymbolForAPI(ticker, 'polygon');
    
    const response = await axios.get(`${POLYGON_BASE_URL}/v2/aggs/ticker/${apiSymbol}/prev`, {
      params: {
        apiKey: POLYGON_API_KEY,
      },
    });

    const data = response.data;
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('No data from Polygon API');
    }

    const result = data.results[0];
    return {
      ticker,
      date: new Date(result.t).toISOString().split('T')[0],
      timestamp: Math.floor(result.t / 1000),
      open: result.o,
      high: result.h,
      low: result.l,
      close: result.c,
      volume: result.v,
    };
  } catch (error) {
    logger.error(`Polygon quote error for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get quote with fallback strategy across multiple APIs
 */
export async function getQuote(ticker: string): Promise<MarketQuote | null> {
  const cacheKey = `quote:${ticker}`;
  
  return cachedFetch(
    cacheKey,
    async () => {
      logger.debug(`Fetching quote for ${ticker}...`);
      
      // Try IBKR first if available
      if (process.env.IBKR_GATEWAY_URL) {
        try {
          const ibkrQuote = await ibkrClient.getQuote(ticker);
          if (ibkrQuote) {
            logger.debug(`Got quote for ${ticker} from IBKR`);
            return {
              ticker,
              date: new Date().toISOString().split('T')[0],
              timestamp: Date.now(),
              open: ibkrQuote.open,
              high: ibkrQuote.high,
              low: ibkrQuote.low,
              close: ibkrQuote.price,
              volume: ibkrQuote.volume,
            };
          }
        } catch (error) {
          logger.error(`IBKR quote failed for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      // Special handling for VIX - prioritize Alpha Vantage which tends to work better for indexes
      if (isVolatilityIndex(ticker)) {
        logger.debug(`${ticker} is a volatility index, adjusting API priority...`);
        
        // Try Alpha Vantage first for VIX
        if (process.env.ALPHA_VANTAGE_API_KEY) {
          try {
            const quote = await getAlphaVantageQuote(ticker);
            if (quote) {
              logger.debug(`Got quote for ${ticker} from Alpha Vantage`);
              return quote;
            }
          } catch (error) {
            logger.error(`Alpha Vantage quote failed for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
      
      // Try Polygon.io next (primary API for regular symbols)
      if (POLYGON_API_KEY && !isVolatilityIndex(ticker)) {
        try {
          const quote = await getPolygonQuote(ticker);
          if (quote) {
            logger.debug(`Got quote for ${ticker} from Polygon`);
            return quote;
          }
        } catch (error) {
          logger.error(`Polygon quote failed for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      // Try Alpha Vantage as fallback (if not already tried for VIX)
      if (process.env.ALPHA_VANTAGE_API_KEY && !isVolatilityIndex(ticker)) {
        try {
          const quote = await getAlphaVantageQuote(ticker);
          if (quote) {
            logger.debug(`Got quote for ${ticker} from Alpha Vantage`);
            return quote;
          }
        } catch (error) {
          logger.error(`Alpha Vantage quote failed for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      // Try Twelve Data as final fallback
      if (TWELVE_DATA_API_KEY) {
        try {
          const quote = await getTwelveDataQuote(ticker);
          if (quote) {
            logger.debug(`Got quote for ${ticker} from Twelve Data`);
            return quote;
          }
        } catch (error) {
          logger.error(`Twelve Data quote failed for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      // If all APIs fail, throw error
      throw new Error(`Unable to fetch quote for ${ticker} from any API`);
    },
    { ttl: CACHE_TTLS.QUOTE }
  );
}

/**
 * Get historical data from Twelve Data
 */
async function getTwelveDataHistorical(
  ticker: string,
  outputsize: number = 90
): Promise<HistoricalData | null> {
  if (!TWELVE_DATA_API_KEY) {
    throw new Error('Twelve Data API key not configured');
  }

  // Apply rate limiting
  await twelveDataRateLimiter.waitIfNeeded();
  await globalRateLimiter.waitIfNeeded();

  try {
    // Use special symbol mapping if needed
    const apiSymbol = getSymbolForAPI(ticker, 'twelveData');
    
    const response = await axios.get(`${TWELVE_DATA_BASE_URL}/time_series`, {
      params: {
        symbol: apiSymbol,
        interval: '1day',
        outputsize: outputsize,
        apikey: TWELVE_DATA_API_KEY,
      },
    });

    const data = response.data;
    if (data.status === 'error') {
      throw new Error(data.message || 'Twelve Data API error');
    }

    const values = data.values || [];
    const dates: string[] = [];
    const timestamps: number[] = [];
    const open: number[] = [];
    const high: number[] = [];
    const low: number[] = [];
    const close: number[] = [];
    const volume: number[] = [];

    // Reverse to get chronological order
    values.reverse().forEach((candle: any) => {
      dates.push(candle.datetime);
      timestamps.push(Math.floor(new Date(candle.datetime).getTime() / 1000));
      open.push(parseFloat(candle.open));
      high.push(parseFloat(candle.high));
      low.push(parseFloat(candle.low));
      close.push(parseFloat(candle.close));
      volume.push(parseInt(candle.volume));
    });

    return {
      dates,
      timestamps,
      open,
      high,
      low,
      close,
      volume,
      adjclose: close, // Twelve Data doesn't provide adjusted close in free tier
    };
  } catch (error) {
    logger.error(`Twelve Data historical error for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get historical data from Polygon
 */
async function getPolygonHistorical(
  ticker: string,
  outputsize: number = 90
): Promise<HistoricalData | null> {
  if (!POLYGON_API_KEY) {
    throw new Error('Polygon API key not configured');
  }

  // Apply rate limiting
  await polygonRateLimiter.waitIfNeeded();
  await globalRateLimiter.waitIfNeeded();

  try {
    // Use special symbol mapping if needed
    const apiSymbol = getSymbolForAPI(ticker, 'polygon');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - outputsize);
    
    const response = await axios.get(`${POLYGON_BASE_URL}/v2/aggs/ticker/${apiSymbol}/range/1/day/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}`, {
      params: {
        apiKey: POLYGON_API_KEY,
        sort: 'asc',
      },
    });

    const data = response.data;
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('No data from Polygon API');
    }

    const dates: string[] = [];
    const timestamps: number[] = [];
    const open: number[] = [];
    const high: number[] = [];
    const low: number[] = [];
    const close: number[] = [];
    const volume: number[] = [];

    data.results.forEach((candle: any) => {
      const date = new Date(candle.t);
      dates.push(date.toISOString().split('T')[0]);
      timestamps.push(Math.floor(candle.t / 1000));
      open.push(candle.o);
      high.push(candle.h);
      low.push(candle.l);
      close.push(candle.c);
      volume.push(candle.v);
    });

    return {
      dates,
      timestamps,
      open,
      high,
      low,
      close,
      volume,
      adjclose: close, // Polygon doesn't provide adjusted close in free tier
    };
  } catch (error) {
    logger.error(`Polygon historical error for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get historical data with fallback strategy
 */
export async function getHistoricalData(
  ticker: string,
  period = '3mo',
  interval = '1d'
): Promise<HistoricalData | null> {
  const cacheKey = `historical:${ticker}:${period}:${interval}`;
  
  return cachedFetch(
    cacheKey,
    async () => {
      logger.debug(`Fetching historical data for ${ticker}...`);
      
      // Try IBKR first if available
      if (process.env.IBKR_GATEWAY_URL) {
        try {
          const ibkrData = await ibkrClient.getHistoricalData(ticker, period, interval === '1d' ? '1d' : '5min');
          if (ibkrData && ibkrData.length > 0) {
            logger.debug(`Got historical data for ${ticker} from IBKR`);
            
            const dates: string[] = [];
            const timestamps: number[] = [];
            const open: number[] = [];
            const high: number[] = [];
            const low: number[] = [];
            const close: number[] = [];
            const volume: number[] = [];
            
            ibkrData.forEach((bar) => {
              const date = new Date(bar.t * 1000);
              dates.push(date.toISOString().split('T')[0]);
              timestamps.push(bar.t * 1000);
              open.push(bar.o);
              high.push(bar.h);
              low.push(bar.l);
              close.push(bar.c);
              volume.push(bar.v);
            });
            
            return {
              dates,
              timestamps,
              open,
              high,
              low,
              close,
              volume,
              adjclose: close,
            };
          }
        } catch (error) {
          logger.error(`IBKR historical data failed for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      // Calculate outputsize based on period
      let outputsize = 90; // default 3 months
      if (period === '1mo') outputsize = 30;
      else if (period === '6mo') outputsize = 180;
      else if (period === '1y') outputsize = 365;
      
      // Try Polygon first (primary API)
      if (POLYGON_API_KEY) {
        try {
          const data = await getPolygonHistorical(ticker, outputsize);
          if (data) {
            logger.debug(`Got historical data for ${ticker} from Polygon`);
            return data;
          }
        } catch (error) {
          logger.error(`Polygon historical failed for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      // Try Alpha Vantage as fallback
      if (process.env.ALPHA_VANTAGE_API_KEY) {
        try {
          const data = await getAlphaVantageHistory(ticker);
          if (data) {
            logger.debug(`Got historical data for ${ticker} from Alpha Vantage`);
            return data;
          }
        } catch (error) {
          logger.error(`Alpha Vantage historical failed for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      // Try Twelve Data as final fallback
      if (TWELVE_DATA_API_KEY) {
        try {
          const data = await getTwelveDataHistorical(ticker, outputsize);
          if (data) {
            logger.debug(`Got historical data for ${ticker} from Twelve Data`);
            return data;
          }
        } catch (error) {
          logger.error(`Twelve Data historical failed for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      // If all APIs fail, throw error
      throw new Error(`Unable to fetch historical data for ${ticker} from any API`);
    },
    { ttl: CACHE_TTLS.HISTORICAL }
  );
}

/**
 * Calculate technical indicators (same as Yahoo Finance implementation)
 */
export { calculateTechnicalIndicators, calculateOptionsMetrics, calculateIvPercentile } from './yahooFinance';

/**
 * Get options chain - Note: Free APIs don't provide options data
 * This is a placeholder that returns null
 */
export async function getOptionsChain(
  ticker: string,
  expirationTimestamp?: number
): Promise<any> {
  logger.warn(`Options data not available in free tier APIs for ${ticker}`);
  return null;
}

/**
 * Export a singleton instance of the market data service
 */
export function getMarketDataService() {
  return {
    getStockQuote: getQuote,
    getHistoricalData,
    getOptionsChain,
    calculateTechnicalIndicators,
    calculateOptionsMetrics,
    calculateIvPercentile
  };
}