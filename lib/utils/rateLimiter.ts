import { createContextLogger } from './logger';

const logger = createContextLogger('RateLimiter');

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  name: string;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  async waitIfNeeded(key: string = 'default'): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get or create request records for this key
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const records = this.requests.get(key)!;
    
    // Clean up old records
    const validRecords = records.filter(r => r.timestamp > windowStart);
    this.requests.set(key, validRecords);
    
    // Count requests in current window
    const requestCount = validRecords.reduce((sum, r) => sum + r.count, 0);
    
    if (requestCount >= this.config.maxRequests) {
      // Calculate wait time until oldest request expires
      const oldestRequest = validRecords[0];
      const waitTime = oldestRequest.timestamp + this.config.windowMs - now + 1000; // Add 1 second buffer
      
      logger.debug(`[${this.config.name}] Rate limit reached (${requestCount}/${this.config.maxRequests}). Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Recursive call to check again after waiting
      return this.waitIfNeeded(key);
    }
    
    // Record this request
    validRecords.push({ timestamp: now, count: 1 });
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

// Create rate limiters for each API
export const polygonRateLimiter = new RateLimiter({
  name: 'Polygon',
  maxRequests: 5,
  windowMs: 60 * 1000 // 1 minute
});

export const alphaVantageRateLimiter = new RateLimiter({
  name: 'AlphaVantage',
  maxRequests: 5,
  windowMs: 60 * 1000 // 1 minute
});

export const twelveDataRateLimiter = new RateLimiter({
  name: 'TwelveData',
  maxRequests: 8,
  windowMs: 60 * 1000 // 1 minute
});

// Global rate limiter to prevent overwhelming any single API
export const globalRateLimiter = new RateLimiter({
  name: 'Global',
  maxRequests: 10,
  windowMs: 60 * 1000 // 1 minute
});