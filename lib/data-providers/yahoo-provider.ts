import {
  BaseDataProvider,
  Option,
  OptionsChain,
  StockQuote,
  HistoricalData,
} from './base';
import {
  getQuote,
  getHistoricalData,
  getOptionsChain,
} from '../services/yahooFinance';

export class YahooProvider extends BaseDataProvider {
  constructor() {
    const delayMs = parseInt(
      process.env.OPTIONS_RATE_LIMIT_DELAY_MS || '200'
    );
    super('Yahoo Finance', 1, 5, delayMs);
  }

  async getOptionsChain(
    ticker: string,
    expiration?: string
  ): Promise<OptionsChain | null> {
    return this.retryWithBackoff(async () => {
      const startTime = Date.now();
      
      let expirationTimestamp: number | undefined;
      if (expiration) {
        expirationTimestamp = new Date(expiration).getTime() / 1000;
      }

      const chainData = await getOptionsChain(ticker, expirationTimestamp);
      
      if (!chainData) {
        return null;
      }

      const latency = Date.now() - startTime;

      const normalizedCalls = chainData.calls.map((call) =>
        this.normalizeGreeks(call)
      );
      const normalizedPuts = chainData.puts.map((put) =>
        this.normalizeGreeks(put)
      );

      return {
        ticker: chainData.ticker,
        expirationDates: chainData.expirationDates,
        currentExpirationDate: chainData.currentExpirationDate,
        strikes: chainData.strikes,
        calls: normalizedCalls,
        puts: normalizedPuts,
        timestamp: Date.now(),
        dataSource: this.name,
        latency,
      };
    });
  }

  async getQuote(ticker: string): Promise<StockQuote | null> {
    return this.retryWithBackoff(async () => {
      const quoteData = await getQuote(ticker);
      
      if (!quoteData) {
        return null;
      }

      return {
        ...quoteData,
        dataSource: this.name,
      };
    });
  }

  async getHistoricalData(
    ticker: string,
    period: string = '3mo',
    interval: string = '1d'
  ): Promise<HistoricalData | null> {
    return this.retryWithBackoff(async () => {
      const historicalData = await getHistoricalData(ticker, period, interval);
      
      if (!historicalData) {
        return null;
      }

      return {
        ticker,
        ...historicalData,
        dataSource: this.name,
      };
    });
  }

  async getAvailableExpirations(ticker: string): Promise<string[] | null> {
    return this.retryWithBackoff(async () => {
      const chainData = await getOptionsChain(ticker);
      
      if (!chainData) {
        return null;
      }

      return chainData.expirationDates;
    });
  }
}