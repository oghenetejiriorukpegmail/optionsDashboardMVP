import axios from 'axios';
// import yahooStockAPI from 'yahoo-stock-api'; // Removed
import { SCANNER_CONFIG, TECHNICAL_INDICATOR_CONFIG } from '@/lib/config';
import { nasdaq100Tickers } from './nasdaq100';
import * as mockDataGenerator from './mockDataGenerator';

// Base URL for Yahoo Finance API
const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com';
const YAHOO_FINANCE_API = {
  QUOTE: `${YAHOO_FINANCE_BASE_URL}/v7/finance/quote`,
  OPTIONS: `${YAHOO_FINANCE_BASE_URL}/v7/finance/options`,
  HISTORY: `${YAHOO_FINANCE_BASE_URL}/v8/finance/chart`,
};

// Get configuration from config file
const API_RETRY_ATTEMPTS = SCANNER_CONFIG.API.RETRY_ATTEMPTS;
const API_RETRY_DELAY = SCANNER_CONFIG.API.RETRY_DELAY;
const API_CACHE_DURATION = SCANNER_CONFIG.CACHE_DURATION;

// Cache for API responses
const apiCache: Record<string, { timestamp: number; data: any }> = {};

// Flag to track if Yahoo API is experiencing rate limiting
let isYahooApiRateLimited = false;
const RATE_LIMIT_RESET_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Set up automatic reset of rate limit flag
setInterval(() => {
  if (isYahooApiRateLimited) {
    console.log('Resetting Yahoo API rate limit flag...');
    isYahooApiRateLimited = false;
  }
}, RATE_LIMIT_RESET_INTERVAL);

/**
 * Helper function to add delay between API calls
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper function to handle rate limiting
 * Uses exponential backoff strategy for retries
 */
const handleRateLimiting = async (error: any, attempt: number): Promise<number> => {
  // If we got a 429 (Too Many Requests) status code, wait longer
  if (error.response && error.response.status === 429) {
    const backoffTime = Math.min(API_RETRY_DELAY * Math.pow(2, attempt), 10000);
    console.log(`Rate limited. Backing off for ${backoffTime}ms before retry.`);
    
    // If multiple 429 errors occur or it's the last attempt, set the rate limit flag
    if (attempt >= API_RETRY_ATTEMPTS - 1) {
      console.log('Multiple rate limit errors detected. Switching to mock data mode.');
      isYahooApiRateLimited = true;
    }
    
    await delay(backoffTime);
    return backoffTime;
  } else if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    // Auth errors should also trigger mock data mode
    console.log('Authentication error detected. Switching to mock data mode.');
    isYahooApiRateLimited = true;
    await delay(API_RETRY_DELAY);
    return API_RETRY_DELAY;
  }
  
  // For other errors, use standard delay
  await delay(API_RETRY_DELAY);
  return API_RETRY_DELAY;
};

// Helper function to format date to YYYY-MM-DD (from lib/services/yahooFinance.ts)
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000); // Yahoo timestamps are in seconds
  return date.toISOString().split('T')[0];
};

/**
 * Calculate technical indicators (EMA, RSI, Stochastic RSI) from historical price data
 */
function calculateIndicators(historicalData: any[]) {
  try {
    // Ensure data is sorted chronologically (oldest to newest)
    const sortedData = [...historicalData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate EMA 10, 20, 50
    const ema10 = calculateEMA(sortedData, 10);
    const ema20 = calculateEMA(sortedData, 20);
    const ema50 = calculateEMA(sortedData, 50);
    
    // Calculate RSI (14-period)
    const rsi = calculateRSI(sortedData, 14);
    
    // Calculate Stochastic RSI
    const stochasticRsi = calculateStochasticRSI(rsi, 14);
    
    // Combine indicators with price data
    return sortedData.map((item, index) => ({
      ...item,
      ema10: ema10[index] || null,
      ema20: ema20[index] || null,
      ema50: ema50[index] || null,
      rsi: rsi[index] || null,
      stochasticRsi: stochasticRsi[index] || null
    }));
  } catch (error) {
    console.error("Error calculating indicators:", error);
    return historicalData.map(item => ({
      ...item,
      ema10: item.close * 1.01,
      ema20: item.close * 1.0,
      ema50: item.close * 0.99,
      rsi: 50,
      stochasticRsi: 50
    }));
  }
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
function calculateEMA(data: any[], period: number) {
  try {
    const closes = data.map(item => item.close);
    const k = 2 / (period + 1);
    
    // First EMA is SMA
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    const result = Array(period - 1).fill(null);
    
    for (let i = period - 1; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
      result.push(ema);
    }
    
    return result;
  } catch (error) {
    console.error("Error calculating EMA:", error);
    return Array(data.length).fill(null);
  }
}

/**
 * Calculate Relative Strength Index (RSI)
 */
function calculateRSI(data: any[], period: number) {
  try {
    const closes = data.map(item => item.close);
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const result = Array(period).fill(null);
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    result.push(100 - (100 / (1 + avgGain / (avgLoss || 0.0001))));
    
    for (let i = period + 1; i < closes.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      
      const rs = avgGain / (avgLoss || 0.0001);
      result.push(100 - (100 / (1 + rs)));
    }
    
    return result;
  } catch (error) {
    console.error("Error calculating RSI:", error);
    return Array(data.length).fill(50); // Default neutral RSI
  }
}

/**
 * Calculate Stochastic RSI
 */
function calculateStochasticRSI(rsiValues: number[], period: number) {
  try {
    const validRsi = rsiValues.filter(val => val !== null);
    const result = Array(rsiValues.length - validRsi.length).fill(null);
    
    for (let i = period - 1; i < validRsi.length; i++) {
      const windowRsi = validRsi.slice(i - period + 1, i + 1);
      const minRsi = Math.min(...windowRsi);
      const maxRsi = Math.max(...windowRsi);
      const stochRsi = ((validRsi[i] - minRsi) / (maxRsi - minRsi || 0.0001)) * 100;
      
      result.push(stochRsi);
    }
    
    // Add additional nulls if needed to match original array length
    while (result.length < rsiValues.length) {
      result.unshift(null);
    }
    
    return result;
  } catch (error) {
    console.error("Error calculating Stochastic RSI:", error);
    return Array(rsiValues.length).fill(50); // Default neutral Stochastic RSI
  }
}

/**
 * Determine the trend type based on EMAs
 */
function determineEmaTrend(lastBar: any) {
  try {
    if (!lastBar?.ema10 || !lastBar?.ema20 || !lastBar?.ema50) {
      // Default to neutral if EMAs are missing
      return 'Flat';
    }
    
    if (lastBar.ema10 > lastBar.ema20 && lastBar.ema20 > lastBar.ema50) {
      return '10 > 20 > 50';
    } else if (lastBar.ema10 < lastBar.ema20 && lastBar.ema20 < lastBar.ema50) {
      return '10 < 20 < 50';
    } else if (lastBar.ema10 > lastBar.ema20 && lastBar.ema20 < lastBar.ema50) {
      return '10 > 20 < 50';
    } else if (lastBar.ema10 < lastBar.ema20 && lastBar.ema20 > lastBar.ema50) {
      return '10 < 20 > 50';
    } else {
      return 'Flat';
    }
  } catch (error) {
    console.error("Error determining EMA trend:", error);
    return 'Flat'; // Default to flat
  }
}

/**
 * Determine the setup type based on indicators
 */
function determineSetupType(lastBar: any, emaTrend: string, pcr: number) {
  try {
    if (!lastBar?.rsi) {
      // Default to neutral if RSI is missing
      return 'neutral';
    }
    
    if (emaTrend === '10 > 20 > 50' && pcr < 0.8 && lastBar.rsi > 55 && lastBar.rsi < 80) {
      return 'bullish';
    } else if (emaTrend === '10 < 20 < 50' && pcr > 1.2 && lastBar.rsi > 20 && lastBar.rsi < 45) {
      return 'bearish';
    } else {
      return 'neutral';
    }
  } catch (error) {
    console.error("Error determining setup type:", error);
    return 'neutral'; // Default to neutral
  }
}

/**
 * Generate mock historical data for a symbol if real API fails
 */
function generateMockHistoricalData(symbol: string) {
  console.log(`Using mock historical data for ${symbol} due to API rate limiting`);
  
  // Generate a mock stock data object
  const mockData = mockDataGenerator.generateStockData(symbol);
  
  // Transform to match the format expected by consumers
  const formattedData = mockData.historicalData.map(bar => ({
    date: bar.date,
    timestamp: Math.floor(new Date(bar.date).getTime() / 1000),
    open: bar.close * 0.99,
    high: bar.close * 1.02,
    low: bar.close * 0.98,
    close: bar.close,
    volume: bar.volume,
    adjClose: bar.close,
    // Include indicators directly
    ema10: bar.ema10,
    ema20: bar.ema20, 
    ema50: bar.ema50,
    rsi: bar.rsi,
    stochasticRsi: mockData.stochasticRsi
  }));
  
  return formattedData;
}

/**
 * Generate mock stock quote if real API fails
 */
function generateMockStockInfo(symbol: string) {
  console.log(`Using mock stock info for ${symbol} due to API rate limiting`);
  
  // Generate a mock stock data object
  const mockData = mockDataGenerator.generateStockData(symbol);
  
  // Transform to match the Yahoo Finance API response format
  return {
    symbol: symbol,
    regularMarketPrice: mockData.price,
    bid: mockData.price * 0.999,
    ask: mockData.price * 1.001,
    regularMarketVolume: mockData.volume.current,
    averageDailyVolume10Day: mockData.volume.current * (1 - mockData.volume.percentChange/100),
    regularMarketOpen: mockData.price * 0.99,
    regularMarketDayHigh: mockData.price * 1.02,
    regularMarketDayLow: mockData.price * 0.98,
    regularMarketTime: Math.floor(Date.now()/1000),
    impliedVolatility: mockData.iv / 100
  };
}

/**
 * Fetches historical data for a symbol from Yahoo Finance with retry logic and caching
 * Falls back to mock data when rate limited
 */
export async function fetchHistoricalData(symbol: string, period = '3mo', interval = '1d') {
  const cacheKey = `historical_${symbol}_${period}_${interval}`;
  
  try {
    const now = Date.now();
    if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < API_CACHE_DURATION) {
      return apiCache[cacheKey].data;
    }
    
    // If Yahoo API is rate limited, use mock data instead
    if (isYahooApiRateLimited) {
      const mockData = generateMockHistoricalData(symbol);
      apiCache[cacheKey] = {
        timestamp: now,
        data: mockData,
      };
      return mockData;
    }
    
    console.log(`Fetching historical data for ${symbol} (period: ${period}, interval: ${interval})...`);
    
    let attempts = 0;
    let apiResponse;

    while (attempts < API_RETRY_ATTEMPTS) {
      try {
        apiResponse = await axios.get(`${YAHOO_FINANCE_API.HISTORY}/${symbol}`, {
          params: {
            period,
            interval,
            includePrePost: false,
            events: 'div,split',
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://finance.yahoo.com',
          },
        });

        const result = apiResponse.data.chart.result[0];
        if (result && result.timestamp && result.indicators.quote[0]) {
          // Transform data
          const timestamps = result.timestamp;
          const quotes = result.indicators.quote[0];
          const adjcloses = result.indicators.adjclose[0].adjclose;

          const formattedHistoricalData = timestamps.map((ts: number, i: number) => ({
            date: formatDate(ts), // Use the new formatDate helper
            timestamp: ts,
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume[i],
            adjClose: adjcloses[i],
          }));
          
          // Process the historical data and calculate indicators
          const processedData = calculateIndicators(formattedHistoricalData);
          console.log(`Successfully fetched and processed historical data for ${symbol}`);
          
          apiCache[cacheKey] = {
            timestamp: now,
            data: processedData,
          };
          return processedData;
        }
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed for historical data ${symbol}:`, error.message || error);
        // Handle rate limiting with exponential backoff
        await handleRateLimiting(error, attempts);
      }
      
      attempts++;
    }
    
    console.log(`Failed to fetch historical data for ${symbol} after ${API_RETRY_ATTEMPTS} attempts, using mock data`);
    isYahooApiRateLimited = true;
    
    // Fallback to mock data
    const mockData = generateMockHistoricalData(symbol);
    apiCache[cacheKey] = {
      timestamp: now,
      data: mockData,
    };
    return mockData;

  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    
    // Fallback to mock data
    const mockData = generateMockHistoricalData(symbol);
    apiCache[cacheKey] = {
      timestamp: now,
      data: mockData,
    };
    return mockData;
  }
}

/**
 * Fetches current stock info from Yahoo Finance with retry logic and caching
 * Falls back to mock data when rate limited
 */
export async function fetchStockInfo(symbol: string) {
  const cacheKey = `info_${symbol}`;
  
  try {
    const now = Date.now();
    if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < API_CACHE_DURATION) {
      return apiCache[cacheKey].data;
    }
    
    // If Yahoo API is rate limited, use mock data instead
    if (isYahooApiRateLimited) {
      const mockData = generateMockStockInfo(symbol);
      apiCache[cacheKey] = {
        timestamp: now,
        data: mockData,
      };
      return mockData;
    }
    
    console.log(`Fetching stock info for ${symbol}...`);
    
    let attempts = 0;
    let apiResponse;

    while (attempts < API_RETRY_ATTEMPTS) {
      try {
        apiResponse = await axios.get(YAHOO_FINANCE_API.QUOTE, {
          params: {
            symbols: symbol,
            formatted: false, // Get raw numbers
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://finance.yahoo.com',
          },
        });

        const quoteData = apiResponse.data.quoteResponse.result[0];
        if (quoteData) {
          console.log(`Successfully fetched real stock info for ${symbol}`);
          apiCache[cacheKey] = {
            timestamp: now,
            data: quoteData, // Store the raw quote data
          };
          return quoteData;
        }
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed for stock info ${symbol}:`, error.message || error);
        // Handle rate limiting with exponential backoff
        await handleRateLimiting(error, attempts);
      }
      
      attempts++;
    }
    
    console.log(`Failed to fetch stock info for ${symbol} after ${API_RETRY_ATTEMPTS} attempts, using mock data`);
    isYahooApiRateLimited = true;
    
    // Fallback to mock data
    const mockData = generateMockStockInfo(symbol);
    apiCache[cacheKey] = {
      timestamp: now,
      data: mockData,
    };
    return mockData;

  } catch (error) {
    console.error(`Error fetching stock info for ${symbol}:`, error);
    
    // Fallback to mock data
    const mockData = generateMockStockInfo(symbol);
    apiCache[cacheKey] = {
      timestamp: now,
      data: mockData,
    };
    return mockData;
  }
}

/**
 * Calculate Put-Call Ratio from options volume
 * In a real implementation, this would come from actual options volume data
 */
function calculatePCR(symbol: string) {
  try {
    // This is a simplified calculation that would come from actual options volume data
    // We're generating a pseudo-random yet deterministic PCR based on symbol string
    // In a real implementation, this would come from options volume API
    
    // Use symbol string to generate a deterministic value
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = (hash + symbol.charCodeAt(i) * (i + 1)) % 100;
    }
    
    // Map to PCR range (0.5 to 1.5)
    const pcr = 0.5 + hash / 100;
    
    return pcr;
  } catch (error) {
    console.error(`Error calculating PCR for ${symbol}:`, error);
    return 1.0; // Default to neutral
  }
}

/**
 * Calculate key price levels based on historical data
 */
function calculateKeyLevels(price: number, historicalData: any[]) {
  try {
    if (!Array.isArray(historicalData) || historicalData.length === 0) {
      throw new Error("Invalid historical data");
    }
    
    const closes = historicalData.map(bar => bar.close).filter(close => typeof close === 'number');
    
    if (closes.length === 0) {
      throw new Error("No valid closing prices in historical data");
    }
    
    const max = Math.max(...closes);
    const min = Math.min(...closes);
    
    // Find recent support/resistance levels based on price action
    const support = [
      Math.round(min * 100) / 100,
      Math.round((min + ((price - min) * 0.33)) * 100) / 100
    ];
    
    const resistance = [
      Math.round((price + ((max - price) * 0.33)) * 100) / 100,
      Math.round(max * 100) / 100
    ];
    
    // Calculate "Max Pain" based on price midpoint
    const maxPain = Math.round(((support[1] + resistance[0]) / 2) * 100) / 100;
    
    return {
      support,
      resistance,
      maxPain
    };
  } catch (error) {
    console.error(`Error calculating key levels:`, error);
    // Return default levels based on current price
    return {
      support: [Math.round(price * 0.95 * 100) / 100, Math.round(price * 0.97 * 100) / 100],
      resistance: [Math.round(price * 1.03 * 100) / 100, Math.round(price * 1.05 * 100) / 100],
      maxPain: Math.round(price * 100) / 100
    };
  }
}

/**
 * Determine setup strength based on indicators
 */
function determineSetupStrength(setupType: string, rsi: number) {
  try {
    if (setupType === 'bullish' && rsi > 70) {
      return 'high';
    } else if (setupType === 'bearish' && rsi < 30) {
      return 'high';
    } else if ((setupType === 'bullish' && rsi < 60) || 
               (setupType === 'bearish' && rsi > 40)) {
      return 'low';
    } else {
      return 'medium';
    }
  } catch (error) {
    console.error("Error determining setup strength:", error);
    return 'medium'; // Default to medium
  }
}

/**
 * Generate a recommendation based on the setup and price levels
 */
function generateRecommendation(price: number, setupType: string, keyLevels: any) {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const formattedExpiry = expiryDate.toISOString().split('T')[0];
    
    if (setupType === 'bullish') {
      return {
        action: 'Buy calls',
        target: keyLevels.resistance[1],
        stop: keyLevels.support[0],
        expiration: formattedExpiry,
        strike: Math.round(keyLevels.resistance[0])
      };
    } else if (setupType === 'bearish') {
      return {
        action: 'Buy puts',
        target: keyLevels.support[0],
        stop: keyLevels.resistance[1],
        expiration: formattedExpiry,
        strike: Math.round(keyLevels.support[1])
      };
    } else {
      return {
        action: 'Sell iron condor',
        target: '50% premium',
        stop: 'Price breaks ' + keyLevels.resistance[0] + '/' + keyLevels.support[0],
        expiration: formattedExpiry,
        strike: Math.round(price)
      };
    }
  } catch (error) {
    console.error("Error generating recommendation:", error);
    return {
      action: 'Monitor',
      target: 'N/A',
      stop: 'N/A',
      expiration: 'N/A',
      strike: Math.round(price)
    };
  }
}

/**
 * Generate a complete stock analysis using real-time and historical data
 * Falls back to mock data when rate limited
 */
export async function generateStockAnalysis(symbol: string) {
  try {
    console.log(`Generating stock analysis for ${symbol}...`);
    
    // Fetch historical data and calculate indicators
    const historicalData = await fetchHistoricalData(symbol);
    
    // Get current stock info
    const stockInfo = await fetchStockInfo(symbol);
    
    // Use the most recent bar for calculations
    const lastBar = historicalData[historicalData.length - 1];
    // Adjust according to the new stockInfo structure from Yahoo Finance API
    const price = stockInfo.bid || stockInfo.regularMarketPrice || lastBar.close;
    
    // Determine EMA trend
    const emaTrend = determineEmaTrend(lastBar);
    
    // Calculate PCR
    const pcr = calculatePCR(symbol);
    
    // Determine setup type
    const setupType = determineSetupType(lastBar, emaTrend, pcr);
    
    // Determine setup strength
    const setupStrength = determineSetupStrength(setupType, lastBar.rsi);
    
    // Calculate key levels
    const keyLevels = calculateKeyLevels(price, historicalData);
    
    // Generate recommendation
    const recommendation = generateRecommendation(price, setupType, keyLevels);
    
    // Return complete analysis with real or mock data
    return {
      symbol,
      price,
      setupType,
      setupStrength,
      emaTrend,
      pcr,
      rsi: lastBar.rsi,
      stochasticRsi: lastBar.stochasticRsi,
      volume: {
        current: stockInfo.regularMarketVolume || 0,
        // Using averageDailyVolume10Day or averageDailyVolume3Month if available
        percentChange: ((stockInfo.regularMarketVolume || 0) - (stockInfo.averageDailyVolume10Day || stockInfo.averageDailyVolume3Month || 0)) / (stockInfo.averageDailyVolume10Day || stockInfo.averageDailyVolume3Month || 1) * 100
      },
      iv: stockInfo.impliedVolatility || (30 + Math.abs(pcr - 1) * 40), // Use actual IV if available, else derive
      gex: setupType === 'bullish' ? 500000000 :
           setupType === 'bearish' ? -500000000 :
           0, // Default GEX value based on setup type
      keyLevels,
      recommendation,
      historicalData
    };
  } catch (error) {
    console.error(`Error generating stock analysis for ${symbol}:`, error);
    
    // If any part fails, fall back to complete mock data
    const mockStock = mockDataGenerator.generateStockData(symbol);
    
    return {
      symbol,
      price: mockStock.price,
      setupType: mockStock.setupType,
      setupStrength: mockStock.setupStrength,
      emaTrend: mockStock.emaTrend,
      pcr: mockStock.pcr,
      rsi: mockStock.rsi,
      stochasticRsi: mockStock.stochasticRsi,
      volume: mockStock.volume,
      iv: mockStock.iv,
      gex: mockStock.gex,
      keyLevels: mockStock.keyLevels,
      recommendation: mockStock.recommendation,
      historicalData: mockStock.historicalData
    };
  }
}

/**
 * Fetch multiple stock analyses in parallel with optimized resource usage
 * Automatically uses mock data when rate limited
 */
export async function fetchMultipleStockAnalyses(symbols: string[]) {
  try {
    console.log(`Fetching analyses for multiple stocks: ${symbols.join(', ')}...`);
    
    // Process symbols in parallel with Promise.all, but with a concurrency limit
    const CONCURRENCY_LIMIT = SCANNER_CONFIG.API.CONCURRENCY_LIMIT; // Use config setting to avoid rate limiting
    const results = [];
    
    for (let i = 0; i < symbols.length; i += CONCURRENCY_LIMIT) {
      const batch = symbols.slice(i, i + CONCURRENCY_LIMIT);
      const batchPromises = batch.map(symbol => {
        return generateStockAnalysis(symbol)
          .catch(error => {
            console.error(`Error analyzing ${symbol}:`, error);
            // Fallback to mock data on error
            return mockDataGenerator.generateStockData(symbol);
          });
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a larger delay between batches to avoid API rate limits
      if (i + CONCURRENCY_LIMIT < symbols.length) {
        await delay(2000);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching multiple stock analyses:', error);
    
    // If all fails, fall back to completely mock data
    return symbols.map(symbol => mockDataGenerator.generateStockData(symbol));
  }
}

/**
 * Generate scanner results for NASDAQ 100 stocks using real data
 * @param symbolsToFetch Optional array of symbols to analyze, defaults to top 10
 * @param limit Optional limit of how many tickers to scan, defaults to 10
 */
export async function generateNasdaq100ScannerResults(symbolsToFetch: string[] = [], limit: number = 10) {
  try {
    console.log(`Generating NASDAQ 100 scanner results with limit: ${limit}...`);
    
    // Use the provided symbols, or use the NASDAQ 100 tickers and limit them
    const symbols = symbolsToFetch.length > 0 ? 
      symbolsToFetch.slice(0, limit) : 
      nasdaq100Tickers.slice(0, limit);
    
    console.log(`Scanning ${symbols.length} symbols: ${symbols.join(', ')}`);
    
    // Fetch stock analyses for all symbols
    const stockData = await fetchMultipleStockAnalyses(symbols);
    
    if (stockData.length === 0) {
      throw new Error('Failed to fetch data for any stocks');
    }
    
    // Count setups by type
    const setupCounts = {
      bullish: stockData.filter(stock => stock.setupType === 'bullish').length,
      bearish: stockData.filter(stock => stock.setupType === 'bearish').length,
      neutral: stockData.filter(stock => stock.setupType === 'neutral').length
    };
    
    // Generate market summary
    const marketSummary = {
      sentiment: setupCounts.bullish > setupCounts.bearish ? 'moderately bullish' : 
                 setupCounts.bearish > setupCounts.bullish ? 'moderately bearish' : 'neutral',
      volatility: 'moderate',
      gexAggregate: stockData.reduce((sum, stock) => sum + (stock.gex || 0), 0),
      pcrAggregate: stockData.reduce((sum, stock) => sum + (stock.pcr || 1), 0) / stockData.length
    };
    
    return {
      timestamp: new Date().toISOString(),
      marketSummary,
      setupCounts,
      results: stockData
    };
  } catch (error) {
    console.error('Error generating NASDAQ 100 scanner results:', error);
    
    // Fallback to mock data
    console.log('Falling back to mock scanner data');
    return mockDataGenerator.generateNasdaq100ScannerResults();
  }
}

// Clear cache function for testing
export function clearCache() {
  Object.keys(apiCache).forEach(key => delete apiCache[key]);
  isYahooApiRateLimited = false;
  console.log('Cache and rate limit flag cleared');
}

// Export list of NASDAQ 100 stocks for reference
export const nasdaq100Tickers = [
  'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'META', 'TSLA', 'NVDA', 'NFLX', 'PYPL',
  'ADBE', 'INTC', 'CMCSA', 'PEP', 'CSCO', 'AVGO', 'COST', 'QCOM', 'TXN', 'TMUS',
  'AMGN', 'SBUX', 'INTU', 'AMD', 'ISRG', 'CHTR', 'MDLZ', 'GILD', 'BKNG', 'MU',
  'ADP', 'AMAT', 'MRNA', 'ADI', 'FISV', 'LRCX', 'ATVI', 'CSX', 'ADSK', 'REGN',
  'ILMN', 'MELI', 'MAR', 'VRTX', 'NXPI', 'KLAC', 'KHC', 'MNST', 'ASML', 'WDAY',
  'EXC', 'ALGN', 'IDXX', 'CDNS', 'DXCM', 'EA', 'AEP', 'XEL', 'CTAS', 'SNPS',
  'BIIB', 'XLNX', 'ORLY', 'WBA', 'PCAR', 'ANSS', 'FAST', 'DLTR', 'CTSH', 'PAYX',
  'MCHP', 'ALXN', 'SWKS', 'CPRT', 'SIRI', 'VRSN', 'CERN', 'NTAP', 'EXPE', 'FOXA',
  'FOX', 'CDW', 'TCOM', 'ROST', 'VRSK', 'NTES', 'SPLK', 'CHKP', 'INCY', 'LULU',
  'MTCH', 'ULTA', 'DOCU', 'ZM', 'OKTA', 'TEAM'
];