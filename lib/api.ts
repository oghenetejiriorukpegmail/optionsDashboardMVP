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
}

/**
 * Fetch scanner results with optional parameters
 */
export async function fetchScannerResults(options: ScannerOptions = {}) {
  try {
    const { setupType, symbol, refresh, limit } = options;
    
    // Build query string
    const params = new URLSearchParams();
    if (setupType) params.append('setupType', setupType);
    if (symbol) params.append('symbol', symbol);
    if (refresh) params.append('refresh', 'true');
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = `/api/scanner${queryString ? `?${queryString}` : ''}`;
    
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
    
    return await response.json();
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
      errorMessage: error instanceof Error ? error.message : String(error)
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
