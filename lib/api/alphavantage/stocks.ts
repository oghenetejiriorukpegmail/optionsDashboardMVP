import { callAlphaVantageApi } from './client';

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
    function: 