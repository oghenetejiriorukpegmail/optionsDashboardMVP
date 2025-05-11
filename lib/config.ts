/**
 * Application configuration settings
 */

export const SCANNER_CONFIG = {
  /**
   * Default number of tickers to analyze
   */
  DEFAULT_TICKER_LIMIT: 10,
  
  /**
   * Maximum number of tickers that can be analyzed
   */
  MAX_TICKER_LIMIT: 100,
  
  /**
   * Data cache duration in milliseconds
   * 5 minutes = 5 * 60 * 1000 = 300000
   */
  CACHE_DURATION: 300000,
  
  /**
   * API request settings
   */
  API: {
    /**
     * Number of retries for API requests
     */
    RETRY_ATTEMPTS: 3,
    
    /**
     * Delay between retries in milliseconds
     */
    RETRY_DELAY: 2000,
    
    /**
     * Maximum number of concurrent API requests
     * to avoid rate limiting
     */
    CONCURRENCY_LIMIT: 1,
  }
};

/**
 * Technical indicator default settings
 */
export const TECHNICAL_INDICATOR_CONFIG = {
  /**
   * Default EMA periods
   */
  EMA_PERIODS: {
    SHORT: 10,
    MEDIUM: 20,
    LONG: 50
  },
  
  /**
   * Default RSI period
   */
  RSI_PERIOD: 14,
  
  /**
   * Default Stochastic RSI period
   */
  STOCH_RSI_PERIOD: 14,
  
  /**
   * Thresholds for technical indicators
   */
  THRESHOLDS: {
    /**
     * RSI thresholds
     */
    RSI: {
      OVERSOLD: 30,
      NEUTRAL_LOW: 45,
      NEUTRAL_HIGH: 55,
      OVERBOUGHT: 70
    },
    
    /**
     * PCR thresholds based on IV levels
     */
    PCR: {
      LOW_IV: {
        BULLISH: 0.7,
        BEARISH: 1.3
      },
      MODERATE_IV: {
        BULLISH: 0.8,
        BEARISH: 1.2
      },
      HIGH_IV: {
        BULLISH: 0.5,
        BEARISH: 1.5
      }
    },
    
    /**
     * Gamma Exposure (GEX) thresholds
     */
    GEX: {
      STRONG_POSITIVE: 500000000,
      STRONG_NEGATIVE: -500000000,
      BREAKOUT_THRESHOLD: 200000000
    }
  }
};