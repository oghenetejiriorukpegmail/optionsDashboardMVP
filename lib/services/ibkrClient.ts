/**
 * Interactive Brokers Client Portal API Service
 * 
 * This service provides access to real market data through IBKR's REST API
 * Requires Client Portal Gateway to be running locally
 */

// IBKR Client Portal Gateway default URL
const IBKR_BASE_URL = process.env.IBKR_GATEWAY_URL || 'https://localhost:5000';
const IBKR_ACCOUNT = process.env.IBKR_ACCOUNT_ID || '';

// Simple rate limiter for IBKR API
class IBKRRateLimiter {
  private lastRequest = 0;
  private readonly minInterval = 20; // 50 requests per second = 20ms between requests

  async checkLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
    }
    
    this.lastRequest = Date.now();
  }
}

const ibkrRateLimiter = new IBKRRateLimiter();

interface IBKRContract {
  conid: number;
  symbol: string;
  secType: string;
  exchange: string;
  currency: string;
}

interface IBKRQuote {
  31: string; // Last price
  84: string; // Bid
  86: string; // Ask
  87: string; // Volume
  7295: string; // Open
  7296: string; // Close
  70: string; // High
  71: string; // Low
  82: string; // Change
  83: string; // Change %
}

interface IBKROptionChain {
  symbol: string;
  expirations: string[];
  strikes: number[];
}

interface IBKRHistoricalData {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

class IBKRClientService {
  private headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  /**
   * Initialize session with IBKR gateway
   */
  async initializeSession(): Promise<boolean> {
    try {
      // Check if gateway is running
      const response = await fetch(`${IBKR_BASE_URL}/v1/api/iserver/auth/status`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error('IBKR Gateway not available');
      }

      const data = await response.json();
      
      // If not authenticated, we need to authenticate
      if (!data.authenticated) {
        console.log('IBKR session not authenticated. Please log in through the Client Portal Gateway.');
        return false;
      }

      // Keep session alive
      await this.keepAlive();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize IBKR session:', error);
      return false;
    }
  }

  /**
   * Keep the session alive
   */
  async keepAlive(): Promise<void> {
    try {
      await fetch(`${IBKR_BASE_URL}/v1/api/tickle`, {
        method: 'POST',
        headers: this.headers,
      });
    } catch (error) {
      console.error('Failed to keep session alive:', error);
    }
  }

  /**
   * Search for a contract by symbol
   */
  async searchContract(symbol: string, secType: string = 'STK'): Promise<IBKRContract | null> {
    await ibkrRateLimiter.checkLimit();
    
    try {
      const response = await fetch(
        `${IBKR_BASE_URL}/v1/api/iserver/secdef/search?symbol=${symbol}&secType=${secType}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to search contract: ${response.status}`);
      }

      const contracts = await response.json();
      
      // Return the first US stock contract
      return contracts.find((c: any) => 
        c.description && 
        c.conid && 
        (c.description.includes('NASDAQ') || c.description.includes('NYSE'))
      ) || null;
    } catch (error) {
      console.error(`Failed to search contract for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string): Promise<{
    symbol: string;
    price: number;
    bid: number;
    ask: number;
    volume: number;
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePercent: number;
  } | null> {
    const contract = await this.searchContract(symbol);
    if (!contract) return null;

    await ibkrRateLimiter.checkLimit();

    try {
      // Request market data
      const response = await fetch(
        `${IBKR_BASE_URL}/v1/api/iserver/marketdata/snapshot?conids=${contract.conid}&fields=31,84,86,87,7295,7296,70,71,82,83`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get quote: ${response.status}`);
      }

      const data = await response.json();
      const quote = data[0] as IBKRQuote;

      return {
        symbol,
        price: parseFloat(quote['31'] || '0'),
        bid: parseFloat(quote['84'] || '0'),
        ask: parseFloat(quote['86'] || '0'),
        volume: parseInt(quote['87'] || '0'),
        open: parseFloat(quote['7295'] || '0'),
        high: parseFloat(quote['70'] || '0'),
        low: parseFloat(quote['71'] || '0'),
        close: parseFloat(quote['7296'] || '0'),
        change: parseFloat(quote['82'] || '0'),
        changePercent: parseFloat(quote['83'] || '0'),
      };
    } catch (error) {
      console.error(`Failed to get quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get historical data for a symbol
   */
  async getHistoricalData(
    symbol: string,
    period: string = '1d',
    bar: string = '5min'
  ): Promise<IBKRHistoricalData[]> {
    const contract = await this.searchContract(symbol);
    if (!contract) return [];

    await ibkrRateLimiter.checkLimit();

    try {
      const response = await fetch(
        `${IBKR_BASE_URL}/v1/api/iserver/marketdata/history?conid=${contract.conid}&period=${period}&bar=${bar}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get historical data: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error(`Failed to get historical data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get options chain for a symbol
   */
  async getOptionsChain(symbol: string): Promise<{
    symbol: string;
    expirations: string[];
    strikes: Array<{
      strike: number;
      call?: {
        conid: number;
        bid: number;
        ask: number;
        last: number;
        volume: number;
        openInterest: number;
        iv: number;
        delta?: number;
        gamma?: number;
        theta?: number;
        vega?: number;
      };
      put?: {
        conid: number;
        bid: number;
        ask: number;
        last: number;
        volume: number;
        openInterest: number;
        iv: number;
        delta?: number;
        gamma?: number;
        theta?: number;
        vega?: number;
      };
    }>;
  } | null> {
    const contract = await this.searchContract(symbol);
    if (!contract) return null;

    await ibkrRateLimiter.checkLimit();

    try {
      // Get option chain info
      const response = await fetch(
        `${IBKR_BASE_URL}/v1/api/iserver/secdef/option-chain?conid=${contract.conid}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get options chain: ${response.status}`);
      }

      const chainData = await response.json();
      
      // Get strikes for the nearest expiration
      if (chainData.expirations && chainData.expirations.length > 0) {
        const nearestExpiry = chainData.expirations[0];
        
        // Get strikes for this expiration
        const strikesResponse = await fetch(
          `${IBKR_BASE_URL}/v1/api/iserver/secdef/strikes?conid=${contract.conid}&expiry=${nearestExpiry}&sectype=OPT`,
          { headers: this.headers }
        );

        if (strikesResponse.ok) {
          const strikesData = await strikesResponse.json();
          
          // Get detailed option data for each strike
          const strikes = await Promise.all(
            strikesData.strikes.slice(0, 20).map(async (strike: number) => {
              // This would require additional API calls for each option contract
              // For now, return basic structure
              return {
                strike,
                // In production, fetch actual option quotes here
              };
            })
          );

          return {
            symbol,
            expirations: chainData.expirations,
            strikes,
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to get options chain for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    await ibkrRateLimiter.checkLimit();

    try {
      const response = await fetch(
        `${IBKR_BASE_URL}/v1/api/portfolio/accounts`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get account info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  }

  /**
   * Get portfolio positions
   */
  async getPositions(): Promise<any[]> {
    await ibkrRateLimiter.checkLimit();

    try {
      const accounts = await this.getAccountInfo();
      if (!accounts || accounts.length === 0) return [];

      const accountId = accounts[0].accountId || IBKR_ACCOUNT;

      const response = await fetch(
        `${IBKR_BASE_URL}/v1/api/portfolio/${accountId}/positions`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get positions: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const ibkrClient = new IBKRClientService();

// Auto-initialize and keep alive
let keepAliveInterval: NodeJS.Timeout | null = null;

export async function initializeIBKR(): Promise<boolean> {
  const initialized = await ibkrClient.initializeSession();
  
  if (initialized) {
    // Keep session alive every 5 minutes
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    keepAliveInterval = setInterval(() => {
      ibkrClient.keepAlive();
    }, 5 * 60 * 1000);
  }

  return initialized;
}

export async function stopIBKR(): Promise<void> {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}