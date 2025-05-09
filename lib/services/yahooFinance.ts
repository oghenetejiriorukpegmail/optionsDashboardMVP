import axios from 'axios';
import * as talib from 'ta-lib';

// Types for Yahoo Finance API responses
interface YahooQuote {
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketPrice: number;
  regularMarketVolume: number;
  regularMarketTime: number;
}

interface YahooOptionChain {
  expirationDates: number[];
  strikes: number[];
  calls: YahooOption[];
  puts: YahooOption[];
}

interface YahooOption {
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
}

interface YahooHistoricalData {
  date: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  adjclose: number[];
}

// Base URL for Yahoo Finance API
const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com';
const YAHOO_FINANCE_API = {
  QUOTE: `${YAHOO_FINANCE_BASE_URL}/v7/finance/quote`,
  OPTIONS: `${YAHOO_FINANCE_BASE_URL}/v7/finance/options`,
  HISTORY: `${YAHOO_FINANCE_BASE_URL}/v8/finance/chart`,
};

// Helper function to format date to YYYY-MM-DD
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
};

// Get current stock quote
export async function getQuote(ticker: string): Promise<{
  ticker: string;
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
} | null> {
  try {
    const response = await axios.get(YAHOO_FINANCE_API.QUOTE, {
      params: {
        symbols: ticker,
        formatted: false,
      },
    });

    const quoteData = response.data.quoteResponse.result[0] as YahooQuote;
    
    if (!quoteData) {
      console.error(`No quote data found for ${ticker}`);
      return null;
    }
    
    return {
      ticker,
      date: formatDate(quoteData.regularMarketTime),
      timestamp: quoteData.regularMarketTime,
      open: quoteData.regularMarketOpen,
      high: quoteData.regularMarketDayHigh,
      low: quoteData.regularMarketDayLow,
      close: quoteData.regularMarketPrice,
      volume: quoteData.regularMarketVolume,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${ticker}:`, error);
    return null;
  }
}

// Get historical data
export async function getHistoricalData(
  ticker: string,
  period = '3mo',
  interval = '1d'
): Promise<{
  dates: string[];
  timestamps: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  adjclose: number[];
} | null> {
  try {
    const response = await axios.get(`${YAHOO_FINANCE_API.HISTORY}/${ticker}`, {
      params: {
        period,
        interval,
        includePrePost: false,
        events: 'div,split',
      },
    });

    const result = response.data.chart.result[0];
    if (!result) {
      console.error(`No historical data found for ${ticker}`);
      return null;
    }

    const timestamps = result.timestamp;
    const dates = timestamps.map(formatDate);
    const { open, high, low, close, volume } = result.indicators.quote[0];
    const { adjclose } = result.indicators.adjclose[0];

    return {
      dates,
      timestamps,
      open,
      high,
      low,
      close,
      volume,
      adjclose,
    };
  } catch (error) {
    console.error(`Error fetching historical data for ${ticker}:`, error);
    return null;
  }
}

// Get options chain
export async function getOptionsChain(ticker: string, expirationTimestamp?: number): Promise<{
  ticker: string;
  expirationDates: string[];
  currentExpirationDate: string;
  strikes: number[];
  calls: YahooOption[];
  puts: YahooOption[];
} | null> {
  try {
    let url = `${YAHOO_FINANCE_API.OPTIONS}/${ticker}`;
    if (expirationTimestamp) {
      url += `?date=${expirationTimestamp}`;
    }

    const response = await axios.get(url);
    const optionChain = response.data.optionChain.result[0] as YahooOptionChain;
    
    if (!optionChain) {
      console.error(`No options chain found for ${ticker}`);
      return null;
    }
    
    // Format expiration dates
    const expirationDates = optionChain.expirationDates.map(formatDate);
    
    return {
      ticker,
      expirationDates,
      currentExpirationDate: formatDate(optionChain.expirationDates[0]),
      strikes: optionChain.strikes,
      calls: optionChain.calls,
      puts: optionChain.puts,
    };
  } catch (error) {
    console.error(`Error fetching options chain for ${ticker}:`, error);
    return null;
  }
}

// Calculate technical indicators
export function calculateTechnicalIndicators(historicalData: {
  close: number[];
  high: number[];
  low: number[];
}): {
  ema10: number[];
  ema20: number[];
  ema50: number[];
  rsi14: number[];
  stochRsi: number[];
} {
  try {
    // EMA calculations
    const ema10 = talib.EMA(historicalData.close, 10);
    const ema20 = talib.EMA(historicalData.close, 20);
    const ema50 = talib.EMA(historicalData.close, 50);
    
    // RSI calculation
    const rsi14 = talib.RSI(historicalData.close, 14);
    
    // Stochastic RSI calculation (simplified)
    // Note: This is a simplified version - for accurate Stochastic RSI, you may need a library that supports it directly
    const rsiPeriod = 14;
    const stochPeriod = 14;
    const kPeriod = 3;
    const dPeriod = 3;
    
    // Calculate RSI for Stochastic RSI
    const rsiValues = talib.RSI(historicalData.close, rsiPeriod);
    
    // Calculate Stochastic of RSI
    const stochRsi = [];
    for (let i = stochPeriod - 1; i < rsiValues.length; i++) {
      const rsiSlice = rsiValues.slice(i - stochPeriod + 1, i + 1);
      const min = Math.min(...rsiSlice);
      const max = Math.max(...rsiSlice);
      
      // K value calculation
      const k = (rsiValues[i] - min) / (max - min) * 100;
      stochRsi.push(k);
    }
    
    // Fill beginning with NaN to match length
    const padding = Array(historicalData.close.length - stochRsi.length).fill(NaN);
    
    return {
      ema10,
      ema20,
      ema50,
      rsi14,
      stochRsi: [...padding, ...stochRsi],
    };
  } catch (error) {
    console.error('Error calculating technical indicators:', error);
    return {
      ema10: [],
      ema20: [],
      ema50: [],
      rsi14: [],
      stochRsi: [],
    };
  }
}

// Calculate options-based metrics
export function calculateOptionsMetrics(calls: YahooOption[], puts: YahooOption[], currentPrice: number): {
  pcr: number;
  maxPain: number;
  totalCallOi: number;
  totalPutOi: number;
  totalCallVolume: number;
  totalPutVolume: number;
  vwiv: number;
  gammaExposure: number;
} {
  // Put-Call Ratio calculation
  const totalCallOi = calls.reduce((sum, option) => sum + option.openInterest, 0);
  const totalPutOi = puts.reduce((sum, option) => sum + option.openInterest, 0);
  const pcr = totalPutOi / totalCallOi;
  
  const totalCallVolume = calls.reduce((sum, option) => sum + option.volume, 0);
  const totalPutVolume = puts.reduce((sum, option) => sum + option.volume, 0);
  
  // Max Pain calculation
  const strikes = [...new Set([...calls, ...puts].map(option => option.strike))].sort((a, b) => a - b);
  
  let minPain = Infinity;
  let maxPainStrike = 0;
  
  for (const strike of strikes) {
    let totalPain = 0;
    
    // Calculate pain for call options
    for (const call of calls) {
      if (strike < call.strike) {
        // Out of the money, no pain
        continue;
      }
      // In the money, calculate pain
      totalPain += call.openInterest * (strike - call.strike);
    }
    
    // Calculate pain for put options
    for (const put of puts) {
      if (strike > put.strike) {
        // Out of the money, no pain
        continue;
      }
      // In the money, calculate pain
      totalPain += put.openInterest * (put.strike - strike);
    }
    
    if (totalPain < minPain) {
      minPain = totalPain;
      maxPainStrike = strike;
    }
  }
  
  // Volume-Weighted Implied Volatility (VWIV)
  const totalCallVolWeight = calls.reduce((sum, option) => sum + (option.volume * option.impliedVolatility), 0);
  const totalPutVolWeight = puts.reduce((sum, option) => sum + (option.volume * option.impliedVolatility), 0);
  const vwiv = (totalCallVolWeight + totalPutVolWeight) / (totalCallVolume + totalPutVolume || 1);
  
  // Simplified Gamma Exposure calculation (approximation)
  const callGamma = calls.reduce((sum, option) => {
    // Only include options with delta and gamma data
    if (option.delta && option.gamma) {
      return sum + (option.openInterest * option.gamma * 100 * currentPrice);
    }
    return sum;
  }, 0);
  
  const putGamma = puts.reduce((sum, option) => {
    // Only include options with delta and gamma data
    if (option.delta && option.gamma) {
      return sum - (option.openInterest * option.gamma * 100 * currentPrice);
    }
    return sum;
  }, 0);
  
  const gammaExposure = callGamma + putGamma;
  
  return {
    pcr,
    maxPain: maxPainStrike,
    totalCallOi,
    totalPutOi,
    totalCallVolume,
    totalPutVolume,
    vwiv,
    gammaExposure,
  };
}

// Get IV percentile based on historical IV data
export function calculateIvPercentile(currentIv: number, historicalIvs: number[]): number {
  const sortedIvs = [...historicalIvs].sort((a, b) => a - b);
  const position = sortedIvs.findIndex(iv => iv >= currentIv);
  return position / sortedIvs.length * 100;
}
