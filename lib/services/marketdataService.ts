import { createContextLogger } from '../utils/logger';
import { MarketDataProvider } from '../data-providers/marketdata-provider';
import type { OptionsChain, StockQuote, HistoricalData } from '../data-providers/base';

const logger = createContextLogger('MarketDataService');

/**
 * Singleton MarketData provider instance
 * - Uses API keys from env: MARKETDATA_APP_API_KEY1, MARKETDATA_APP_API_KEY2, MARKETDATA_APP_API_KEY
 * - The provider rotates keys internally for basic load distribution
 */
const marketDataProvider = new MarketDataProvider();

/**
 * Fetch a stock quote via MarketData.app provider
 * Returns null if unable to fetch.
 */
export async function getQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const quote = await marketDataProvider.getQuote(ticker);
    if (!quote) {
      logger.warn(`MarketDataService: no quote returned for ${ticker}`);
      return null;
    }
    return quote as StockQuote;
  } catch (err: any) {
    logger.error(`MarketDataService: error fetching quote for ${ticker}: ${err?.message || err}`);
    return null;
  }
}

/**
 * Fetch historical OHLC data via MarketData.app provider
 * period and interval use the provider-friendly strings (e.g. period='3M', interval='D')
 */
export async function getHistoricalData(
  ticker: string,
  period: string = '3M',
  interval: string = 'D'
): Promise<HistoricalData | null> {
  try {
    const data = await marketDataProvider.getHistoricalData(ticker, period, interval);
    if (!data) {
      logger.warn(`MarketDataService: no historical data for ${ticker}`);
      return null;
    }
    return data as HistoricalData;
  } catch (err: any) {
    logger.error(`MarketDataService: error fetching historical data for ${ticker}: ${err?.message || err}`);
    return null;
  }
}

/**
 * Fetch options chain for a ticker and optional expiration
 * expiration may be a date string (ISO) or whatever caller uses; provider will accept undefined to return nearest.
 */
export async function getOptionsChain(ticker: string, expiration?: string): Promise<OptionsChain | null> {
  try {
    const chain = await marketDataProvider.getOptionsChain(ticker, expiration);
    if (!chain) {
      logger.warn(`MarketDataService: no options chain for ${ticker}`);
      return null;
    }
    return chain as OptionsChain;
  } catch (err: any) {
    logger.error(`MarketDataService: error fetching options chain for ${ticker}: ${err?.message || err}`);
    return null;
  }
}

/**
 * Helper to list available expirations for a ticker
 */
export async function getAvailableExpirations(ticker: string): Promise<string[] | null> {
  try {
    const exps = await marketDataProvider.getAvailableExpirations(ticker);
    return exps;
  } catch (err: any) {
    logger.error(`MarketDataService: error fetching expirations for ${ticker}: ${err?.message || err}`);
    return null;
  }
}

/**
 * Expose provider information for debugging / telemetry
 */
export function providerInfo() {
  return {
    name: marketDataProvider.getName(),
    priority: marketDataProvider.getPriority(),
    rateLimit: marketDataProvider.getRateLimit(),
  };
}