// Special symbols that may require different handling across APIs
export const SPECIAL_SYMBOLS = {
  // Volatility indexes - some APIs don't support these
  VOLATILITY_INDEXES: ['VIX', 'VXN', 'RVX'],
  
  // Symbols that might need special handling
  SYMBOL_MAPPINGS: {
    // Map VIX to alternative symbols if needed
    'VIX': {
      polygon: 'VIX',
      alphaVantage: 'VIX', // May not work with free tier
      twelveData: 'VIX:CBOE', // Twelve Data might need exchange specification
      yahoo: '^VIX' // Yahoo uses ^ prefix for indexes
    },
    'SPY': {
      polygon: 'SPY',
      alphaVantage: 'SPY',
      twelveData: 'SPY',
      yahoo: 'SPY'
    },
    'QQQ': {
      polygon: 'QQQ',
      alphaVantage: 'QQQ',
      twelveData: 'QQQ',
      yahoo: 'QQQ'
    }
  }
};

// Function to get the appropriate symbol for a specific API
export function getSymbolForAPI(symbol: string, api: 'polygon' | 'alphaVantage' | 'twelveData' | 'yahoo'): string {
  const mapping = SPECIAL_SYMBOLS.SYMBOL_MAPPINGS[symbol as keyof typeof SPECIAL_SYMBOLS.SYMBOL_MAPPINGS];
  if (mapping && mapping[api]) {
    return mapping[api];
  }
  return symbol;
}

// Function to check if a symbol is a volatility index
export function isVolatilityIndex(symbol: string): boolean {
  return SPECIAL_SYMBOLS.VOLATILITY_INDEXES.includes(symbol);
}

// Function to check if a symbol needs special handling
export function needsSpecialHandling(symbol: string): boolean {
  return symbol in SPECIAL_SYMBOLS.SYMBOL_MAPPINGS;
}