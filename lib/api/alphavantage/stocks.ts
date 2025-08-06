import { callAlphaVantageApi } from './client';
import { createContextLogger } from '../../utils/logger';

const logger = createContextLogger('AlphaVantageStocks');

/**
 * Fetch intraday time series stock data
 */
export async function fetchIntraday(symbol: string, interval: string = '5min', outputsize: string = 'compact') {
  return callAlphaVantageApi({
    function: 'TIME_SERIES_INTRADAY',
    symbol,
    interval,
    outputsize
  });
}

/**
 * Fetch daily time series stock data
 */
export async function fetchDaily(symbol: string, outputsize: string = 'compact') {
  return callAlphaVantageApi({
    function: 'TIME_SERIES_DAILY',
    symbol,
    outputsize
  });
}

/**
 * Fetch quote endpoint data
 */
export async function fetchQuote(symbol: string) {
  return callAlphaVantageApi({
    function: 'GLOBAL_QUOTE',
    symbol
  });
}

/**
 * Convert Alpha Vantage quote to our format
 */
export async function getQuote(ticker: string) {
  try {
    const response = await fetchQuote(ticker);
    
    if (!response || !response['Global Quote']) {
      throw new Error('Invalid response from Alpha Vantage');
    }
    
    const quote = response['Global Quote'];
    const now = new Date();
    
    return {
      ticker,
      date: now.toISOString().split('T')[0],
      timestamp: Math.floor(now.getTime() / 1000),
      open: parseFloat(quote['02. open'] || '0'),
      high: parseFloat(quote['03. high'] || '0'),
      low: parseFloat(quote['04. low'] || '0'),
      close: parseFloat(quote['05. price'] || '0'),
      volume: parseInt(quote['06. volume'] || '0'),
    };
  } catch (error) {
    logger.error(`Alpha Vantage quote error for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Convert Alpha Vantage daily data to our format
 */
export async function getHistoricalData(ticker: string) {
  try {
    const response = await fetchDaily(ticker, 'full');
    
    if (!response || !response['Time Series (Daily)']) {
      throw new Error('Invalid response from Alpha Vantage');
    }
    
    const timeSeries = response['Time Series (Daily)'];
    const dates: string[] = [];
    const timestamps: number[] = [];
    const open: number[] = [];
    const high: number[] = [];
    const low: number[] = [];
    const close: number[] = [];
    const volume: number[] = [];
    
    // Get last 90 days of data
    const sortedDates = Object.keys(timeSeries).sort();
    const last90Days = sortedDates.slice(-90);
    
    for (const date of last90Days) {
      const data = timeSeries[date];
      dates.push(date);
      timestamps.push(Math.floor(new Date(date).getTime() / 1000));
      open.push(parseFloat(data['1. open']));
      high.push(parseFloat(data['2. high']));
      low.push(parseFloat(data['3. low']));
      close.push(parseFloat(data['4. close']));
      volume.push(parseInt(data['5. volume']));
    }
    
    return {
      dates,
      timestamps,
      open,
      high,
      low,
      close,
      volume,
      adjclose: close, // Alpha Vantage doesn't provide adjusted close in free tier
    };
  } catch (error) {
    logger.error(`Alpha Vantage historical error for ${ticker}:`, {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}