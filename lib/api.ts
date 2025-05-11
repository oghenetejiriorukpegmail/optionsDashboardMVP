// This file contains utility functions for fetching data from the API endpoints

/**
 * Fetch stocks data from the API
 */
export async function fetchStocks() {
  try {
    const response = await fetch('/api/tickers');
    if (!response.ok) {
      throw new Error(`Failed to fetch stocks data: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stocks data:', error);
    return [];
  }
}

/**
 * Fetch options chain data for a specific symbol and expiration
 */
export async function fetchOptionsChain(symbol: string, expiration?: string) {
  try {
    let url = `/api/options-data?ticker=${symbol}`;
    if (expiration) {
      url += `&expiration=${expiration}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch options chain data: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching options chain data:', error);
    return null;
  }
}

/**
 * Fetch technical indicators for a specific symbol
 */
export async function fetchTechnicalIndicators(symbol: string) {
  try {
    const response = await fetch(`/api/historical-data?ticker=${symbol}&type=technical`);
    if (!response.ok) {
      throw new Error(`Failed to fetch technical indicators: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching technical indicators:', error);
    return null;
  }
}

/**
 * Options for fetchScannerResults
 */
export interface ScannerOptions {
  setupType?: string;
  symbol?: string;
  refresh?: boolean;
  limit?: number;
  filters?: ScannerFilters;
}

/**
 * Interface for advanced scanner filters
 */
export interface ScannerFilters {
  pcr?: {
    min: number;
    max: number;
  };
  rsi?: {
    min: number;
    max: number;
  };
  stochasticRsi?: {
    min: number;
    max: number;
  };
  iv?: {
    min: number;
    max: number;
  };
  gex?: string;
  includeGamma?: boolean;
  includeVanna?: boolean;
  includeCharm?: boolean;
}

/**
 * Fetch scanner results with optional parameters
 */
export async function fetchScannerResults(options: ScannerOptions = {}) {
  try {
    const { setupType, symbol, refresh, limit, filters } = options;

    // Build query string
    const params = new URLSearchParams();
    if (setupType) params.append('setupType', setupType);
    if (symbol) params.append('symbol', symbol);
    if (refresh) params.append('refresh', 'true');
    if (limit) params.append('limit', limit.toString());

    // Add advanced filters to the query if provided
    if (filters) {
      // PCR filter
      if (filters.pcr) {
        params.append('pcrMin', filters.pcr.min.toString());
        params.append('pcrMax', filters.pcr.max.toString());
      }

      // RSI filter
      if (filters.rsi) {
        params.append('rsiMin', filters.rsi.min.toString());
        params.append('rsiMax', filters.rsi.max.toString());
      }

      // Stochastic RSI filter
      if (filters.stochasticRsi) {
        params.append('stochRsiMin', filters.stochasticRsi.min.toString());
        params.append('stochRsiMax', filters.stochasticRsi.max.toString());
      }

      // IV filter
      if (filters.iv) {
        params.append('ivMin', filters.iv.min.toString());
        params.append('ivMax', filters.iv.max.toString());
      }

      // GEX filter
      if (filters.gex && filters.gex !== 'all') {
        params.append('gex', filters.gex);
      }

      // Greek analytics filters
      if (filters.includeGamma) params.append('includeGamma', 'true');
      if (filters.includeVanna) params.append('includeVanna', 'true');
      if (filters.includeCharm) params.append('includeCharm', 'true');
    }

    const queryString = params.toString();
    const url = `/api/scanner${queryString ? `?${queryString}` : ''}`;

    console.log('Fetching scanner results with URL:', url);

    // Add retry logic for production
    let retries = 0;
    const maxRetries = 3;
    let response;

    while (retries < maxRetries) {
      response = await fetch(url);

      if (response.ok) {
        break;
      }

      // For errors, retry after a delay
      retries++;
      if (retries < maxRetries) {
        const delay = retries * 1000; // Exponential backoff
        console.log(`Retrying scanner API (${retries}/${maxRetries}) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Failed to fetch scanner results: ${response?.status} ${response?.statusText}`);
    }

    const data = await response.json();

    // If we successfully got data from the API, we need to check if we have
    // applied filters on the client side and the API doesn't support them yet
    if (data && filters && !data.error) {
      // Server-side filters may not be fully implemented yet, so we also
      // filter the results on the client side for maximum compatibility
      if (data.results && Array.isArray(data.results)) {
        data.results = data.results.filter(result => {
          // Skip results that don't match our filters
          if (!result) return false;

          // PCR filter
          const pcrInRange = filters.pcr
            ? (result.pcr >= filters.pcr.min && result.pcr <= filters.pcr.max)
            : true;

          // RSI filter
          const rsiInRange = filters.rsi
            ? (result.rsi >= filters.rsi.min && result.rsi <= filters.rsi.max)
            : true;

          // Stochastic RSI filter
          const stochRsiInRange = filters.stochasticRsi && result.stochRsi
            ? (result.stochRsi >= filters.stochasticRsi.min && result.stochRsi <= filters.stochasticRsi.max)
            : true;

          // IV filter
          const ivInRange = filters.iv && result.iv
            ? (result.iv >= filters.iv.min && result.iv <= filters.iv.max)
            : true;

          // GEX filter
          let gexMatches = true;
          if (filters.gex && filters.gex !== 'all') {
            gexMatches = filters.gex === 'positive' && result.setupType === 'bullish' ||
                         filters.gex === 'negative' && result.setupType === 'bearish' ||
                         filters.gex === 'neutral' && result.setupType === 'neutral';
          }

          // Return true if all filters match
          return pcrInRange && rsiInRange && stochRsiInRange && ivInRange && gexMatches;
        });
      }

      // Update setupCounts based on filtered results
      if (data.results) {
        data.setupCounts = {
          bullish: data.results.filter((r: any) => r.setupType === 'bullish').length,
          bearish: data.results.filter((r: any) => r.setupType === 'bearish').length,
          neutral: data.results.filter((r: any) => r.setupType === 'neutral').length,
        };
      }
    }

    return data;
  } catch (error) {
    console.error('Error fetching scanner results:', error);

    // Return basic error structure as fallback
    return {
      timestamp: new Date().toISOString(),
      marketSummary: {
        sentiment: 'neutral',
        volatility: 'moderate',
        gexAggregate: 0,
        pcrAggregate: 1.0
      },
      setupCounts: {
        bullish: 0,
        bearish: 0,
        neutral: 0
      },
      results: [],
      error: true,
      errorMessage: error instanceof Error ? error.message : String(error),
      filteredClientSide: true
    };
  }
}

/**
 * Fetch watchlist data
 */
export async function fetchWatchlist() {
  try {
    const response = await fetch('/api/watchlist');
    if (!response.ok) {
      throw new Error(`Failed to fetch watchlist: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
}

/**
 * Interface for watchlist item
 */
export interface WatchlistItem {
  symbol: string;
  price: number;
  setupType: string;
  entryTarget: number;
  stopLoss: number | string;
  [key: string]: any; // For any additional properties
}

/**
 * Add item to watchlist
 */
export async function addToWatchlist(item: WatchlistItem) {
  try {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add item to watchlist: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Remove item from watchlist
 */
export async function removeFromWatchlist(symbol: string) {
  try {
    const response = await fetch(`/api/watchlist?symbol=${symbol}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove item from watchlist: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Calculate position size
 */
export async function calculatePositionSize(data: {
  accountSize: number;
  riskPercentage: number;
  optionPremium: number;
  stockPrice: number;
  iv: number;
  gexAdjustment: string;
}) {
  try {
    const response = await fetch('/api/position-sizing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to calculate position size: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calculating position size:', error);
    
    // Create fallback position sizing calculation
    const { accountSize, riskPercentage, optionPremium, iv } = data;
    const riskAmount = accountSize * (riskPercentage / 100);
    const contractsToTrade = Math.floor(riskAmount / optionPremium);
    
    // Apply IV adjustment - reduce position size for high IV
    const ivAdjustment = iv > 50 ? 0.8 : 1;
    const adjustedContracts = Math.floor(contractsToTrade * ivAdjustment);
    
    return { 
      success: true, 
      contractsToTrade: adjustedContracts,
      maxRisk: adjustedContracts * optionPremium,
      note: 'Fallback calculation used due to API error',
      dataSource: 'client-side fallback'
    };
  }
}
