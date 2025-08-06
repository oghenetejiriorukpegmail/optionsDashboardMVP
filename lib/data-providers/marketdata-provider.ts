import axios from 'axios';
import {
  BaseDataProvider,
  Option,
  OptionsChain,
  StockQuote,
  HistoricalData,
} from './base';
import { createContextLogger } from '../utils/logger';

const logger = createContextLogger('MarketDataProvider');

const MARKETDATA_BASE_URL = 'https://api.marketdata.app/v1';

export class MarketDataProvider extends BaseDataProvider {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;

  constructor() {
    super('MarketData.app', 0, 100, 100); // Higher priority (0) and rate limit
    
    // Collect all available API keys
    this.apiKeys = [
      process.env.MARKETDATA_APP_API_KEY1,
      process.env.MARKETDATA_APP_API_KEY2,
      process.env.MARKETDATA_APP_API_KEY, // Legacy key as fallback
    ].filter(Boolean) as string[];
    
    if (this.apiKeys.length === 0) {
      logger.warn('No MarketData.app API keys found in environment variables');
    } else {
      logger.info(`MarketData provider initialized with ${this.apiKeys.length} API key(s)`);
    }
  }

  private getCurrentApiKey(): string {
    if (this.apiKeys.length === 0) return '';
    
    const key = this.apiKeys[this.currentKeyIndex];
    // Rotate to next key for load balancing
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.getCurrentApiKey()}`,
      'Accept': 'application/json',
    };
  }

  async getOptionsChain(
    ticker: string,
    expiration?: string
  ): Promise<OptionsChain | null> {
    return this.retryWithBackoff(async () => {
      const startTime = Date.now();
      
      try {
        // If no expiration provided, first get available expirations
        if (!expiration) {
          const expirations = await this.getAvailableExpirations(ticker);
          if (!expirations || expirations.length === 0) {
            return null;
          }
          expiration = expirations[0]; // Use the nearest expiration
        }

        // MarketData.app options chain endpoint
        const url = `${MARKETDATA_BASE_URL}/options/chain/${ticker}`;
        
        const params: any = {};
        if (expiration) {
          params.expiration = expiration;
        }
        
        const response = await axios.get(url, {
          headers: this.getHeaders(),
          params,
        });

        if (response.data.s !== 'ok') {
          throw new Error(`MarketData API error: ${response.data.errmsg || 'Unknown error'}`);
        }

        const data = response.data;
        const latency = Date.now() - startTime;

        // Transform MarketData response to our format
        const calls: Option[] = [];
        const puts: Option[] = [];
        const strikes: number[] = [];

        // MarketData returns options in parallel arrays format
        if (data.optionSymbol && Array.isArray(data.optionSymbol)) {
          const optionCount = data.optionSymbol.length;
          
          for (let i = 0; i < optionCount; i++) {
            const option = {
              symbol: data.optionSymbol[i],
              strike: data.strike?.[i] || 0,
              side: data.side?.[i] || 'unknown',
              last: data.last?.[i] || 0,
              bid: data.bid?.[i] || 0,
              ask: data.ask?.[i] || 0,
              openInterest: data.openInterest?.[i] || 0,
              volume: data.volume?.[i] || 0,
              iv: data.iv?.[i] || 0,
              delta: data.delta?.[i],
              gamma: data.gamma?.[i],
              theta: data.theta?.[i],
              vega: data.vega?.[i],
              expiration: data.expiration?.[i],
              updated: data.updated?.[i],
              inTheMoney: data.inTheMoney?.[i] || false,
            };
            
            const normalizedOption = this.normalizeMarketDataOption(option);
            
            if (!strikes.includes(option.strike)) {
              strikes.push(option.strike);
            }

            if (option.side === 'call') {
              calls.push(normalizedOption);
            } else if (option.side === 'put') {
              puts.push(normalizedOption);
            }
          }
        }

        strikes.sort((a, b) => a - b);

        return {
          ticker,
          expirationDates: [expiration],
          currentExpirationDate: expiration,
          strikes,
          calls,
          puts,
          timestamp: Date.now(),
          dataSource: this.name,
          latency,
        };
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error('Invalid MarketData.app API key');
        }
        throw error;
      }
    });
  }

  async getQuote(ticker: string): Promise<StockQuote | null> {
    return this.retryWithBackoff(async () => {
      try {
        const url = `${MARKETDATA_BASE_URL}/stocks/quotes/${ticker}`;
        
        const response = await axios.get(url, {
          headers: this.getHeaders(),
        });

        if (response.data.s !== 'ok') {
          throw new Error(`MarketData API error: ${response.data.errmsg || 'Unknown error'}`);
        }

        const quote = response.data;
        
        // MarketData.app returns arrays for values, extract first element
        const lastPrice = quote.last?.[0] || quote.last || 0;
        const timestamp = quote.updated?.[0] || quote.updated || Date.now() / 1000;
        
        // For OHLC data, we need to make a separate call to candles endpoint
        // For now, use last price for all OHLC values as a fallback
        return {
          ticker,
          date: new Date(timestamp * 1000).toISOString().split('T')[0],
          timestamp: timestamp,
          open: lastPrice, // Using last price as fallback
          high: lastPrice, // Using last price as fallback
          low: lastPrice,  // Using last price as fallback
          close: lastPrice, // Current price
          volume: quote.volume?.[0] || quote.volume || 0,
          bid: quote.bid?.[0] || quote.bid || undefined,
          ask: quote.ask?.[0] || quote.ask || undefined,
          previousClose: lastPrice - (quote.change?.[0] || quote.change || 0),
          marketCap: quote.marketCap?.[0] || quote.marketCap || undefined,
          peRatio: quote.pe?.[0] || quote.pe || undefined,
          dividendYield: quote.divYield?.[0] || quote.divYield || undefined,
          dataSource: this.name,
        };
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error('Invalid MarketData.app API key');
        }
        throw error;
      }
    });
  }

  async getHistoricalData(
    ticker: string,
    period: string = '3M',
    interval: string = 'D'
  ): Promise<HistoricalData | null> {
    return this.retryWithBackoff(async () => {
      try {
        // Calculate date range based on period
        const to = new Date();
        const from = new Date();
        
        switch (period.toUpperCase()) {
          case '1D':
            from.setDate(from.getDate() - 1);
            break;
          case '1W':
            from.setDate(from.getDate() - 7);
            break;
          case '1M':
            from.setMonth(from.getMonth() - 1);
            break;
          case '3M':
          case '3MO':
            from.setMonth(from.getMonth() - 6); // Use 6 months for better RSI calculation
            break;
          case '6M':
            from.setMonth(from.getMonth() - 6);
            break;
          case '1Y':
            from.setFullYear(from.getFullYear() - 1);
            break;
          default:
            from.setMonth(from.getMonth() - 3); // Default to 3 months
        }

        const fromStr = from.toISOString().split('T')[0];
        const toStr = to.toISOString().split('T')[0];

        const url = `${MARKETDATA_BASE_URL}/stocks/candles/${interval}/${ticker}?from=${fromStr}&to=${toStr}`;
        
        const response = await axios.get(url, {
          headers: this.getHeaders(),
        });

        if (response.data.s !== 'ok') {
          throw new Error(`MarketData API error: ${response.data.errmsg || 'Unknown error'}`);
        }

        const data = response.data;
        
        return {
          ticker,
          dates: data.t.map((timestamp: number) => 
            new Date(timestamp * 1000).toISOString().split('T')[0]
          ),
          timestamps: data.t,
          open: data.o,
          high: data.h,
          low: data.l,
          close: data.c,
          volume: data.v,
          adjclose: data.c, // MarketData doesn't provide adjusted close separately
          dataSource: this.name,
        };
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error('Invalid MarketData.app API key');
        }
        throw error;
      }
    });
  }

  async getAvailableExpirations(ticker: string): Promise<string[] | null> {
    return this.retryWithBackoff(async () => {
      try {
        const url = `${MARKETDATA_BASE_URL}/options/expirations/${ticker}`;
        
        const response = await axios.get(url, {
          headers: this.getHeaders(),
        });

        if (response.data.s !== 'ok') {
          throw new Error(`MarketData API error: ${response.data.errmsg || 'Unknown error'}`);
        }

        // MarketData returns expirations as an array of dates
        return response.data.expirations || [];
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error('Invalid MarketData.app API key');
        }
        throw error;
      }
    });
  }

  private normalizeMarketDataOption(option: any): Option {
    // MarketData.app specific field mapping
    return {
      contractSymbol: option.symbol || option.optionSymbol || '',
      strike: Number(option.strike || 0),
      lastPrice: Number(option.last || option.lastPrice || 0),
      bid: Number(option.bid || 0),
      ask: Number(option.ask || 0),
      change: Number(option.change || 0),
      percentChange: Number(option.changePercent || option.percentChange || 0),
      volume: Number(option.volume || 0),
      openInterest: Number(option.openInterest || option.oi || 0),
      impliedVolatility: Number(option.iv || option.impliedVolatility || 0),
      inTheMoney: Boolean(option.itm || option.inTheMoney || false),
      contractSize: '100',
      currency: 'USD',
      expiration: option.expiration || option.expirationDate || 0,
      lastTradeDate: option.updated || option.lastTradeDate || 0,
      // Greeks if available
      delta: option.delta !== undefined ? Number(option.delta) : undefined,
      gamma: option.gamma !== undefined ? Number(option.gamma) : undefined,
      theta: option.theta !== undefined ? Number(option.theta) : undefined,
      vega: option.vega !== undefined ? Number(option.vega) : undefined,
      rho: option.rho !== undefined ? Number(option.rho) : undefined,
    };
  }
}