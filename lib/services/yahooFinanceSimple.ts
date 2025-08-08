import axios from 'axios';
import * as talib from 'ta-lib';
import { SCANNER_CONFIG, TECHNICAL_INDICATOR_CONFIG } from '@/lib/config';
import { cachedFetch, cacheManager } from './cacheManager';
import { createContextLogger } from '@/lib/utils/logger';
import { getQuote as mdGetQuote, getHistoricalData as mdGetHistoricalData, getOptionsChain as mdGetOptionsChain } from './marketdataService';

const logger = createContextLogger('YahooFinanceSimple');

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

// Base URL for Yahoo Finance API
const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com';
const YAHOO_FINANCE_QUERY2_URL = 'https://query2.finance.yahoo.com';
const YAHOO_FINANCE_API = {
  QUOTE: `${YAHOO_FINANCE_BASE_URL}/v7/finance/quote`,
  OPTIONS: `${YAHOO_FINANCE_BASE_URL}/v7/finance/options`,
  HISTORY: `${YAHOO_FINANCE_BASE_URL}/v8/finance/chart`,
  QUOTE_ALT: `${YAHOO_FINANCE_QUERY2_URL}/v10/finance/quoteSummary`,
};

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get configuration from config file
const API_RETRY_ATTEMPTS = SCANNER_CONFIG.API.RETRY_ATTEMPTS;
const API_RETRY_DELAY = SCANNER_CONFIG.API.RETRY_DELAY;

// Default headers to mimic browser requests
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
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
 * Fetch data from Yahoo Finance API with retries
 */
async function fetchYahooFinanceApi<T>(
  url: string, 
  params?: any
): Promise<T> {
  let attempts = 0;
  let lastError: any;
  
  while (attempts < API_RETRY_ATTEMPTS) {
    try {
      logger.debug(`Attempting Yahoo Finance API call (${attempts + 1}/${API_RETRY_ATTEMPTS}): ${url}`);
      
      const response = await axios.get(url, {
        params,
        headers: DEFAULT_HEADERS,
        timeout: 10000,
      });
      
      return response.data;
    } catch (error: any) {
      attempts++;
      lastError = error;
      
      const status = error.response?.status;
      logger.error(`Yahoo Finance API error (attempt ${attempts}/${API_RETRY_ATTEMPTS}):`, 
        status ? `Status ${status}` : error.message);
      
      // Don't retry on 4xx errors (except 429)
      if (status && status >= 400 && status < 500 && status !== 429) {
        break;
      }
      
      if (attempts < API_RETRY_ATTEMPTS) {
        const backoffTime = status === 429 
          ? Math.min(API_RETRY_DELAY * Math.pow(2, attempts), 30000)
          : API_RETRY_DELAY;
        
        logger.debug(`Waiting ${backoffTime}ms before retry...`);
        await delay(backoffTime);
      }
    }
  }
  
  throw new Error(`Yahoo Finance API failed after ${attempts} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Get current stock quote with caching and fallback
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
      logger.debug(`Fetching quote for ${ticker} from API/provider...`);
      
      try {
        // Prefer MarketData.app when available
        try {
          const mdQuote = await mdGetQuote(ticker);
          if (mdQuote) {
            return {
              ticker: mdQuote.ticker,
              date: mdQuote.date,
              timestamp: mdQuote.timestamp,
              open: mdQuote.open,
              high: mdQuote.high,
              low: mdQuote.low,
              close: mdQuote.close,
              volume: mdQuote.volume,
            };
          }
        } catch (err) {
          // Log and continue to fallback to Yahoo
          logger.debug(`MarketData quote failed for ${ticker}, falling back to Yahoo: ${err instanceof Error ? err.message : String(err)}`);
        }

        const data = await fetchYahooFinanceApi<any>(
          YAHOO_FINANCE_API.QUOTE,
          { symbols: ticker }
        );
        
        const quoteData = data.quoteResponse?.result?.[0];
        if (!quoteData) {
          logger.error(`No quote data found for ${ticker}`);
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
      } catch (error) {
        logger.error(`Error fetching quote for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    },
    { ttl: CACHE_TTLS.QUOTE }
  );
}

/**
 * Get historical data with caching and fallback
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
      logger.debug(`Fetching historical data for ${ticker} from provider/API...`);
      
      try {
        // Prefer MarketData.app
        try {
          const mdHist = await mdGetHistoricalData(ticker, period.toUpperCase() === '3MO' ? '3M' : '3M', 'D');
          if (mdHist) {
            return {
              dates: mdHist.dates,
              timestamps: mdHist.timestamps,
              open: mdHist.open,
              high: mdHist.high,
              low: mdHist.low,
              close: mdHist.close,
              volume: mdHist.volume,
              adjclose: mdHist.adjclose ?? mdHist.close,
            };
          }
        } catch (err) {
          logger.debug(`MarketData historical failed for ${ticker}, falling back to Yahoo: ${err instanceof Error ? err.message : String(err)}`);
        }

        const data = await fetchYahooFinanceApi<any>(
          `${YAHOO_FINANCE_API.HISTORY}/${ticker}`,
          {
            period,
            interval,
            includePrePost: false,
            events: 'div,split',
          }
        );
        
        const result = data.chart?.result?.[0];
        if (!result) {
          logger.error(`No historical data found for ${ticker}`);
          return null;
        }
        
        const timestamps = result.timestamp || [];
        const dates = timestamps.map(formatDate);
        const { open, high, low, close, volume } = result.indicators?.quote?.[0] || {};
        const { adjclose } = result.indicators?.adjclose?.[0] || {};
        
        return {
          dates,
          timestamps,
          open: open || [],
          high: high || [],
          low: low || [],
          close: close || [],
          volume: volume || [],
          adjclose: adjclose || close || [],
        };
      } catch (error) {
        logger.error(`Error fetching historical data for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    },
    { ttl: CACHE_TTLS.HISTORICAL }
  );
}

/**
 * Get options chain with caching and fallback
 */
export async function getOptionsChain(
  ticker: string, 
  expirationTimestamp?: number
): Promise<{
  ticker: string;
  expirationDates: string[];
  currentExpirationDate: string;
  strikes: number[];
  calls: YahooOption[];
  puts: YahooOption[];
} | null> {
  const cacheKey = `options:${ticker}:${expirationTimestamp || 'nearest'}`;
  
  return cachedFetch(
    cacheKey,
    async () => {
      logger.debug(`Fetching options chain for ${ticker} from provider/API...`);
      
      try {
        // Prefer MarketData.app
        try {
          const mdOptions = await mdGetOptionsChain(ticker, expirationTimestamp ? String(expirationTimestamp) : undefined);
          if (mdOptions) {
            return {
              ticker: mdOptions.ticker,
              expirationDates: mdOptions.expirationDates,
              currentExpirationDate: mdOptions.currentExpirationDate,
              strikes: mdOptions.strikes,
              calls: mdOptions.calls as YahooOption[],
              puts: mdOptions.puts as YahooOption[],
            };
          }
        } catch (err) {
          logger.debug(`MarketData options failed for ${ticker}, falling back to Yahoo: ${err instanceof Error ? err.message : String(err)}`);
        }

        let url = `${YAHOO_FINANCE_API.OPTIONS}/${ticker}`;
        const params: any = {};
        if (expirationTimestamp) {
          params.date = expirationTimestamp;
        }
        
        const data = await fetchYahooFinanceApi<any>(
          url,
          params
        );
        
        const optionChain = data.optionChain?.result?.[0];
        if (!optionChain) {
          logger.error(`No options chain found for ${ticker}`);
          return null;
        }
        
        // Format expiration dates
        const expirationDates = (optionChain.expirationDates || []).map(formatDate);
        
        return {
          ticker,
          expirationDates,
          currentExpirationDate: expirationDates[0] || '',
          strikes: optionChain.strikes || [],
          calls: optionChain.options?.[0]?.calls || [],
          puts: optionChain.options?.[0]?.puts || [],
        };
      } catch (error) {
        logger.error(`Error fetching options chain for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    },
    { ttl: CACHE_TTLS.OPTIONS }
  );
}

// Export the same technical indicator functions
export { calculateTechnicalIndicators, calculateOptionsMetrics, calculateIvPercentile } from './yahooFinance';