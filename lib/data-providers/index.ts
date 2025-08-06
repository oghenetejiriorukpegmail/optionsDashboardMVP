import {
  BaseDataProvider,
  OptionsChain,
  StockQuote,
  HistoricalData,
} from './base';
import { YahooProvider } from './yahoo-provider';
import { MarketDataProvider } from './marketdata-provider';

export * from './base';
export * from './yahoo-provider';
export * from './marketdata-provider';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  provider: string;
}

class DataProviderFactory {
  private providers: BaseDataProvider[] = [];
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheTimeout: number;
  private preferredProvider: string | null = null;

  constructor() {
    this.loadConfiguration();
    this.initializeProviders();
  }

  private loadConfiguration() {
    // Load cache timeout from environment
    const cacheTimeoutMinutes = parseInt(
      process.env.OPTIONS_CACHE_TIMEOUT_MINUTES || '15'
    );
    this.cacheTimeout = cacheTimeoutMinutes * 60 * 1000;

    // Load preferred provider from environment
    // Default to marketdata if API key is available, otherwise yahoo
    const hasMarketDataKey = process.env.MARKETDATA_APP_API_KEY1 || process.env.MARKETDATA_APP_API_KEY2 || process.env.MARKETDATA_APP_API_KEY;
    this.preferredProvider = process.env.OPTIONS_DATA_PROVIDER || 
      (hasMarketDataKey ? 'MarketData.app' : 'yahoo');
  }

  private initializeProviders() {
    // Add MarketData provider if any API key is available
    if (process.env.MARKETDATA_APP_API_KEY1 || process.env.MARKETDATA_APP_API_KEY2 || process.env.MARKETDATA_APP_API_KEY) {
      this.providers.push(new MarketDataProvider());
    }
    
    this.providers.push(new YahooProvider());

    // Sort by priority (lower number = higher priority)
    this.providers.sort((a, b) => a.getPriority() - b.getPriority());
  }

  setPreferredProvider(providerName: string) {
    this.preferredProvider = providerName;
  }

  private getCacheKey(method: string, ...args: any[]): string {
    return `${method}:${JSON.stringify(args)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.cacheTimeout) {
      // Cache hit
      return entry.data;
    }
    return null;
  }

  private setCache<T>(key: string, data: T, provider: string) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      provider,
    });
  }

  private getOrderedProviders(): BaseDataProvider[] {
    if (this.preferredProvider) {
      const preferred = this.providers.find(
        (p) => p.getName() === this.preferredProvider
      );
      if (preferred) {
        return [
          preferred,
          ...this.providers.filter((p) => p !== preferred),
        ];
      }
    }
    return this.providers;
  }

  async getOptionsChain(
    ticker: string,
    expiration?: string
  ): Promise<OptionsChain | null> {
    const cacheKey = this.getCacheKey('getOptionsChain', ticker, expiration);
    const cached = this.getFromCache<OptionsChain>(cacheKey);
    if (cached) return cached;

    const providers = this.getOrderedProviders();
    
    for (const provider of providers) {
      try {
        // Attempting to fetch options chain
        const data = await provider.getOptionsChain(ticker, expiration);
        
        if (data) {
          this.setCache(cacheKey, data, provider.getName());
          return data;
        }
      } catch (error) {
        // Error fetching options chain
      }
    }

    // Failed to fetch options chain from all providers
    return null;
  }

  async getQuote(ticker: string): Promise<StockQuote | null> {
    const cacheKey = this.getCacheKey('getQuote', ticker);
    const cached = this.getFromCache<StockQuote>(cacheKey);
    if (cached) return cached;

    const providers = this.getOrderedProviders();
    
    for (const provider of providers) {
      try {
        // Attempting to fetch quote
        const data = await provider.getQuote(ticker);
        
        if (data) {
          this.setCache(cacheKey, data, provider.getName());
          return data;
        }
      } catch (error) {
        // Error fetching quote
      }
    }

    // Failed to fetch quote from all providers
    return null;
  }

  async getHistoricalData(
    ticker: string,
    period?: string,
    interval?: string
  ): Promise<HistoricalData | null> {
    const cacheKey = this.getCacheKey(
      'getHistoricalData',
      ticker,
      period,
      interval
    );
    const cached = this.getFromCache<HistoricalData>(cacheKey);
    if (cached) return cached;

    const providers = this.getOrderedProviders();
    
    for (const provider of providers) {
      try {
        // Attempting to fetch historical data
        const data = await provider.getHistoricalData(ticker, period, interval);
        
        if (data) {
          this.setCache(cacheKey, data, provider.getName());
          return data;
        }
      } catch (error) {
        // Error fetching historical data
      }
    }

    // Failed to fetch historical data from all providers
    return null;
  }

  async getAvailableExpirations(ticker: string): Promise<string[] | null> {
    const cacheKey = this.getCacheKey('getAvailableExpirations', ticker);
    const cached = this.getFromCache<string[]>(cacheKey);
    if (cached) return cached;

    const providers = this.getOrderedProviders();
    
    for (const provider of providers) {
      try {
        // Attempting to fetch expirations
        const data = await provider.getAvailableExpirations(ticker);
        
        if (data) {
          this.setCache(cacheKey, data, provider.getName());
          return data;
        }
      } catch (error) {
        // Error fetching expirations
      }
    }

    // Failed to fetch expirations from all providers
    return null;
  }

  clearCache() {
    this.cache.clear();
  }

  setCacheTimeout(milliseconds: number) {
    this.cacheTimeout = milliseconds;
  }

  getProviders(): string[] {
    return this.providers.map((p) => p.getName());
  }
}

const dataProviderFactory = new DataProviderFactory();

export default dataProviderFactory;