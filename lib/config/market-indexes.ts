// Major market indexes for market context analysis
export const MARKET_INDEXES = {
  // Major US Stock Market Indexes
  SPY: { name: 'S&P 500 ETF', description: 'Tracks S&P 500 index' },
  QQQ: { name: 'NASDAQ 100 ETF', description: 'Tracks NASDAQ 100 index' },
  DIA: { name: 'Dow Jones ETF', description: 'Tracks Dow Jones Industrial Average' },
  IWM: { name: 'Russell 2000 ETF', description: 'Tracks small-cap stocks' },
  
  // Volatility Index
  VIX: { name: 'Volatility Index', description: 'Market fear gauge' },
  
  // Sector ETFs for market breadth
  XLF: { name: 'Financial Sector', description: 'Financial sector ETF' },
  XLK: { name: 'Technology Sector', description: 'Technology sector ETF' },
  XLE: { name: 'Energy Sector', description: 'Energy sector ETF' },
  XLV: { name: 'Healthcare Sector', description: 'Healthcare sector ETF' },
  XLI: { name: 'Industrial Sector', description: 'Industrial sector ETF' },
};

export const CORE_MARKET_INDEXES = ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX'];
export const SECTOR_INDEXES = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI'];
export const ALL_MARKET_INDEXES = [...CORE_MARKET_INDEXES, ...SECTOR_INDEXES];

// Market context thresholds
export const MARKET_THRESHOLDS = {
  // VIX levels
  VIX_LOW: 15,      // Low volatility
  VIX_NORMAL: 20,   // Normal volatility
  VIX_HIGH: 25,     // High volatility
  VIX_EXTREME: 30,  // Extreme volatility
  
  // Market trend thresholds (percentage from 20-day moving average)
  STRONG_UPTREND: 2,    // >2% above 20 MA
  UPTREND: 0.5,         // 0.5-2% above 20 MA
  NEUTRAL: -0.5,        // -0.5% to 0.5% from 20 MA
  DOWNTREND: -2,        // -2% to -0.5% below 20 MA
  STRONG_DOWNTREND: -2, // <-2% below 20 MA
};