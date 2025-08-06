export interface Option {
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
  rho?: number;
}

export interface OptionsChain {
  ticker: string;
  expirationDates: string[];
  currentExpirationDate: string;
  strikes: number[];
  calls: Option[];
  puts: Option[];
  timestamp: number;
  dataSource: string;
  latency?: number;
}

export interface StockQuote {
  ticker: string;
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bid?: number;
  ask?: number;
  previousClose?: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  dataSource: string;
}

export interface HistoricalData {
  ticker: string;
  dates: string[];
  timestamps: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  adjclose: number[];
  dataSource: string;
}

export abstract class BaseDataProvider {
  protected name: string;
  protected priority: number;
  protected rateLimit: number;
  protected delayMs: number;
  protected retryAttempts: number;
  protected retryDelayMs: number;

  constructor(
    name: string,
    priority: number = 100,
    rateLimit: number = 5,
    delayMs: number = 200
  ) {
    this.name = name;
    this.priority = priority;
    this.rateLimit = rateLimit;
    this.delayMs = delayMs;
    this.retryAttempts = 3;
    this.retryDelayMs = 1000;
  }

  abstract getOptionsChain(
    ticker: string,
    expiration?: string
  ): Promise<OptionsChain | null>;

  abstract getQuote(ticker: string): Promise<StockQuote | null>;

  abstract getHistoricalData(
    ticker: string,
    period?: string,
    interval?: string
  ): Promise<HistoricalData | null>;

  abstract getAvailableExpirations(ticker: string): Promise<string[] | null>;

  normalizeGreeks(option: any): Option {
    return {
      contractSymbol: option.contractSymbol || option.symbol || '',
      strike: Number(option.strike || 0),
      lastPrice: Number(option.lastPrice || option.last || 0),
      bid: Number(option.bid || 0),
      ask: Number(option.ask || 0),
      change: Number(option.change || 0),
      percentChange: Number(option.percentChange || option.changePercent || 0),
      volume: Number(option.volume || 0),
      openInterest: Number(option.openInterest || option.oi || 0),
      impliedVolatility: Number(
        option.impliedVolatility || option.iv || option.ivMean || 0
      ),
      inTheMoney: Boolean(option.inTheMoney || option.itm || false),
      contractSize: option.contractSize || '100',
      currency: option.currency || 'USD',
      expiration: Number(option.expiration || option.expirationDate || 0),
      lastTradeDate: Number(option.lastTradeDate || option.lastTrade || 0),
      delta: option.delta !== undefined ? Number(option.delta) : undefined,
      gamma: option.gamma !== undefined ? Number(option.gamma) : undefined,
      theta: option.theta !== undefined ? Number(option.theta) : undefined,
      vega: option.vega !== undefined ? Number(option.vega) : undefined,
      rho: option.rho !== undefined ? Number(option.rho) : undefined,
    };
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = this.retryAttempts
  ): Promise<T | null> {
    let lastError: any;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        // Log error silently in production

        if (attempt < maxAttempts - 1) {
          const backoffTime = Math.min(
            this.retryDelayMs * Math.pow(2, attempt),
            10000
          );
          // Backing off before retry
          await this.delay(backoffTime);
        }
      }
    }

    // Failed after max attempts
    return null;
  }

  getName(): string {
    return this.name;
  }

  getPriority(): number {
    return this.priority;
  }

  getRateLimit(): number {
    return this.rateLimit;
  }
}