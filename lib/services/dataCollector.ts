import { 
  getQuote, 
  getHistoricalData, 
  getOptionsChain, 
  calculateTechnicalIndicators,
  calculateOptionsMetrics,
  calculateIvPercentile
} from './yahooFinance';

import { 
  saveStockData, 
  saveTechnicalIndicators, 
  saveOptionsData, 
  saveMarketSentiment, 
  saveDailySummary,
  getHistoricalData as getDbHistoricalData
} from '../db/repository';

// Default tickers to track
const DEFAULT_TICKERS = ['TSLA', 'AAPL', 'AMZN', 'MSFT', 'NVDA', 'GOOGL', 'META', 'NFLX', 'AMD', 'INTC'];

// Collection intervals
const QUOTE_INTERVAL_MS = 10000; // 10 seconds
const HISTORICAL_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const OPTIONS_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const DAILY_SUMMARY_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Store timers for each ticker
const quoteTimers: Record<string, NodeJS.Timeout> = {};
const historicalTimers: Record<string, NodeJS.Timeout> = {};
const optionsTimers: Record<string, NodeJS.Timeout> = {};
const dailySummaryTimers: Record<string, NodeJS.Timeout> = {};

// Initialize data collection for a ticker
export function initializeDataCollection(ticker: string): void {
  console.log(`Initializing data collection for ${ticker}`);
  
  // Cancel existing timers if they exist
  if (quoteTimers[ticker]) clearInterval(quoteTimers[ticker]);
  if (historicalTimers[ticker]) clearInterval(historicalTimers[ticker]);
  if (optionsTimers[ticker]) clearInterval(optionsTimers[ticker]);
  if (dailySummaryTimers[ticker]) clearInterval(dailySummaryTimers[ticker]);
  
  // Start with an immediate collection
  collectQuoteData(ticker);
  collectHistoricalData(ticker);
  collectOptionsData(ticker);
  generateDailySummary(ticker);
  
  // Set up recurring collections
  quoteTimers[ticker] = setInterval(() => collectQuoteData(ticker), QUOTE_INTERVAL_MS);
  historicalTimers[ticker] = setInterval(() => collectHistoricalData(ticker), HISTORICAL_INTERVAL_MS);
  optionsTimers[ticker] = setInterval(() => collectOptionsData(ticker), OPTIONS_INTERVAL_MS);
  dailySummaryTimers[ticker] = setInterval(() => generateDailySummary(ticker), DAILY_SUMMARY_INTERVAL_MS);
}

// Stop data collection for a ticker
export function stopDataCollection(ticker: string): void {
  console.log(`Stopping data collection for ${ticker}`);
  
  if (quoteTimers[ticker]) {
    clearInterval(quoteTimers[ticker]);
    delete quoteTimers[ticker];
  }
  
  if (historicalTimers[ticker]) {
    clearInterval(historicalTimers[ticker]);
    delete historicalTimers[ticker];
  }
  
  if (optionsTimers[ticker]) {
    clearInterval(optionsTimers[ticker]);
    delete optionsTimers[ticker];
  }
  
  if (dailySummaryTimers[ticker]) {
    clearInterval(dailySummaryTimers[ticker]);
    delete dailySummaryTimers[ticker];
  }
}

// Initialize data collection for default tickers
export function initializeDefaultCollection(): void {
  console.log('Initializing data collection for default tickers');
  
  for (const ticker of DEFAULT_TICKERS) {
    initializeDataCollection(ticker);
  }
}

// Collect quote data for a ticker
async function collectQuoteData(ticker: string): Promise<void> {
  try {
    console.log(`Collecting quote data for ${ticker}`);
    
    const quoteData = await getQuote(ticker);
    if (!quoteData) {
      console.error(`Failed to get quote data for ${ticker}`);
      return;
    }
    
    await saveStockData(quoteData);
    console.log(`Saved quote data for ${ticker}`);
  } catch (error) {
    console.error(`Error collecting quote data for ${ticker}:`, error);
  }
}

// Collect historical data and calculate technical indicators
async function collectHistoricalData(ticker: string): Promise<void> {
  try {
    console.log(`Collecting historical data for ${ticker}`);
    
    const historicalData = await getHistoricalData(ticker, '3mo', '1d');
    if (!historicalData) {
      console.error(`Failed to get historical data for ${ticker}`);
      return;
    }
    
    // Calculate technical indicators
    const indicators = calculateTechnicalIndicators(historicalData);
    
    // Save historical data and indicators
    for (let i = 0; i < historicalData.timestamps.length; i++) {
      const timestamp = historicalData.timestamps[i];
      const date = historicalData.dates[i];
      
      // Skip if close data is missing
      if (historicalData.close[i] === null || historicalData.close[i] === undefined) {
        continue;
      }
      
      // Save stock data
      await saveStockData({
        ticker,
        date,
        timestamp,
        open: historicalData.open[i] || 0,
        high: historicalData.high[i] || 0,
        low: historicalData.low[i] || 0,
        close: historicalData.close[i] || 0,
        volume: historicalData.volume[i] || 0,
      });
      
      // Skip if technical indicators are not available for this index
      if (
        indicators.ema10[i] === null || indicators.ema10[i] === undefined ||
        indicators.ema20[i] === null || indicators.ema20[i] === undefined ||
        indicators.ema50[i] === null || indicators.ema50[i] === undefined ||
        indicators.rsi14[i] === null || indicators.rsi14[i] === undefined ||
        indicators.stochRsi[i] === null || indicators.stochRsi[i] === undefined
      ) {
        continue;
      }
      
      // Save technical indicators
      await saveTechnicalIndicators({
        ticker,
        date,
        timestamp,
        ema_10: indicators.ema10[i] || 0,
        ema_20: indicators.ema20[i] || 0,
        ema_50: indicators.ema50[i] || 0,
        rsi_14: indicators.rsi14[i] || 0,
        stoch_rsi: indicators.stochRsi[i] || 0,
      });
    }
    
    console.log(`Saved historical data and indicators for ${ticker}`);
  } catch (error) {
    console.error(`Error collecting historical data for ${ticker}:`, error);
  }
}

// Collect options data for a ticker
async function collectOptionsData(ticker: string): Promise<void> {
  try {
    console.log(`Collecting options data for ${ticker}`);
    
    // Get current stock price
    const quoteData = await getQuote(ticker);
    if (!quoteData) {
      console.error(`Failed to get quote data for ${ticker}`);
      return;
    }
    
    // Get options chain
    const optionsChain = await getOptionsChain(ticker);
    if (!optionsChain) {
      console.error(`Failed to get options chain for ${ticker}`);
      return;
    }
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Process options metrics
    const optionsMetrics = calculateOptionsMetrics(
      optionsChain.calls,
      optionsChain.puts,
      quoteData.close
    );
    
    // Get historical IV data (simplified - in production, this would use actual historical IV)
    const historicalIvs = optionsChain.calls
      .filter(call => call.impliedVolatility > 0)
      .map(call => call.impliedVolatility);
    
    // Calculate IV percentile
    const avgIv = optionsChain.calls.reduce((sum, call) => sum + call.impliedVolatility, 0) / 
                  optionsChain.calls.length;
    const ivPercentile = calculateIvPercentile(avgIv, historicalIvs);
    
    // Save market sentiment data
    await saveMarketSentiment({
      ticker,
      date: currentDate,
      timestamp: currentTimestamp,
      pcr: optionsMetrics.pcr,
      iv_percentile: ivPercentile,
      max_pain: optionsMetrics.maxPain,
      gamma_exposure: optionsMetrics.gammaExposure,
    });
    
    // Save options data
    for (let i = 0; i < optionsChain.strikes.length; i++) {
      const strike = optionsChain.strikes[i];
      
      // Find corresponding call and put options
      const call = optionsChain.calls.find(c => c.strike === strike);
      const put = optionsChain.puts.find(p => p.strike === strike);
      
      if (!call && !put) continue;
      
      await saveOptionsData({
        ticker,
        expiration_date: optionsChain.currentExpirationDate,
        date: currentDate,
        timestamp: currentTimestamp,
        strike_price: strike,
        call_oi: call?.openInterest || 0,
        put_oi: put?.openInterest || 0,
        call_volume: call?.volume || 0,
        put_volume: put?.volume || 0,
        call_iv: call?.impliedVolatility || 0,
        put_iv: put?.impliedVolatility || 0,
        call_delta: call?.delta || 0,
        put_delta: put?.delta || 0,
        call_gamma: call?.gamma || 0,
        put_gamma: put?.gamma || 0,
      });
    }
    
    console.log(`Saved options data for ${ticker}`);
  } catch (error) {
    console.error(`Error collecting options data for ${ticker}:`, error);
  }
}

// Generate daily summary for a ticker
async function generateDailySummary(ticker: string): Promise<void> {
  try {
    console.log(`Generating daily summary for ${ticker}`);
    
    // Get latest data
    const quoteData = await getQuote(ticker);
    if (!quoteData) {
      console.error(`Failed to get quote data for ${ticker}`);
      return;
    }
    
    // Get options chain for max pain
    const optionsChain = await getOptionsChain(ticker);
    if (!optionsChain) {
      console.error(`Failed to get options chain for ${ticker}`);
      return;
    }
    
    // Get historical data for technical indicators
    const historicalData = await getHistoricalData(ticker, '3mo', '1d');
    if (!historicalData) {
      console.error(`Failed to get historical data for ${ticker}`);
      return;
    }
    
    // Calculate technical indicators
    const indicators = calculateTechnicalIndicators(historicalData);
    
    // Calculate options metrics
    const optionsMetrics = calculateOptionsMetrics(
      optionsChain.calls,
      optionsChain.puts,
      quoteData.close
    );
    
    // Get historical IV data (simplified)
    const historicalIvs = optionsChain.calls
      .filter(call => call.impliedVolatility > 0)
      .map(call => call.impliedVolatility);
    
    // Calculate IV percentile
    const avgIv = optionsChain.calls.reduce((sum, call) => sum + call.impliedVolatility, 0) / 
                  optionsChain.calls.length;
    const ivPercentile = calculateIvPercentile(avgIv, historicalIvs);
    
    // Get latest values for all metrics
    const latest = {
      ema10: indicators.ema10[indicators.ema10.length - 1] || 0,
      ema20: indicators.ema20[indicators.ema20.length - 1] || 0,
      ema50: indicators.ema50[indicators.ema50.length - 1] || 0,
      rsi14: indicators.rsi14[indicators.rsi14.length - 1] || 0,
      stochRsi: indicators.stochRsi[indicators.stochRsi.length - 1] || 0,
    };
    
    // Save daily summary
    await saveDailySummary({
      ticker,
      date: quoteData.date,
      open: quoteData.open,
      high: quoteData.high,
      low: quoteData.low,
      close: quoteData.close,
      volume: quoteData.volume,
      ema_10: latest.ema10,
      ema_20: latest.ema20,
      ema_50: latest.ema50,
      rsi_14: latest.rsi14,
      stoch_rsi: latest.stochRsi,
      pcr: optionsMetrics.pcr,
      iv_percentile: ivPercentile,
      max_pain: optionsMetrics.maxPain,
    });
    
    console.log(`Saved daily summary for ${ticker}`);
  } catch (error) {
    console.error(`Error generating daily summary for ${ticker}:`, error);
  }
}

// Export a function to manually trigger collection (useful for testing)
export async function manuallyCollectData(ticker: string): Promise<void> {
  await collectQuoteData(ticker);
  await collectHistoricalData(ticker);
  await collectOptionsData(ticker);
  await generateDailySummary(ticker);
}
