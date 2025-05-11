import { 
  getQuote, 
  getHistoricalData, 
  getOptionsChain, 
  calculateTechnicalIndicators,
  calculateOptionsMetrics,
  calculateIvPercentile,
  clearCache
} from './enhancedYahooFinance';

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
const QUOTE_INTERVAL_MS = 20000; // 20 seconds
const HISTORICAL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const OPTIONS_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const DAILY_SUMMARY_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Store timers for each ticker
const quoteTimers: Record<string, NodeJS.Timeout> = {};
const historicalTimers: Record<string, NodeJS.Timeout> = {};
const optionsTimers: Record<string, NodeJS.Timeout> = {};
const dailySummaryTimers: Record<string, NodeJS.Timeout> = {};
let cacheCleanupTimer: NodeJS.Timeout | null = null;

// Track collection status for monitoring
const collectionStatus: Record<string, {
  lastQuoteUpdate: number;
  lastHistoricalUpdate: number;
  lastOptionsUpdate: number;
  lastDailySummaryUpdate: number;
  errors: string[];
}> = {};

// Initialize data collection for a ticker
export function initializeDataCollection(ticker: string): void {
  console.log(`Initializing data collection for ${ticker}`);
  
  // Cancel existing timers if they exist
  if (quoteTimers[ticker]) clearInterval(quoteTimers[ticker]);
  if (historicalTimers[ticker]) clearInterval(historicalTimers[ticker]);
  if (optionsTimers[ticker]) clearInterval(optionsTimers[ticker]);
  if (dailySummaryTimers[ticker]) clearInterval(dailySummaryTimers[ticker]);
  
  // Initialize collection status
  collectionStatus[ticker] = {
    lastQuoteUpdate: 0,
    lastHistoricalUpdate: 0,
    lastOptionsUpdate: 0,
    lastDailySummaryUpdate: 0,
    errors: []
  };
  
  // Start collection with initial delay (stagger requests)
  const initialDelay = Math.random() * 5000; // Random delay between 0-5 seconds
  
  setTimeout(() => collectQuoteData(ticker), initialDelay);
  setTimeout(() => collectHistoricalData(ticker), initialDelay + 1000);
  setTimeout(() => collectOptionsData(ticker), initialDelay + 2000);
  setTimeout(() => generateDailySummary(ticker), initialDelay + 3000);
  
  // Set up recurring collections with jitter to avoid thundering herd
  const jitter = (interval: number) => interval + (Math.random() * 0.1 * interval);
  
  quoteTimers[ticker] = setInterval(
    () => collectQuoteData(ticker), 
    jitter(QUOTE_INTERVAL_MS)
  );
  
  historicalTimers[ticker] = setInterval(
    () => collectHistoricalData(ticker), 
    jitter(HISTORICAL_INTERVAL_MS)
  );
  
  optionsTimers[ticker] = setInterval(
    () => collectOptionsData(ticker), 
    jitter(OPTIONS_INTERVAL_MS)
  );
  
  dailySummaryTimers[ticker] = setInterval(
    () => generateDailySummary(ticker), 
    jitter(DAILY_SUMMARY_INTERVAL_MS)
  );
  
  // Initialize cache cleanup if not already running
  if (!cacheCleanupTimer) {
    cacheCleanupTimer = setInterval(clearCache, CACHE_CLEANUP_INTERVAL_MS);
  }
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
  
  // Remove from collection status
  delete collectionStatus[ticker];
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
      const error = `Failed to get quote data for ${ticker}`;
      recordError(ticker, 'quote', error);
      return;
    }
    
    await saveStockData(quoteData);
    collectionStatus[ticker].lastQuoteUpdate = Date.now();
    console.log(`Saved quote data for ${ticker}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    recordError(ticker, 'quote', errorMsg);
  }
}

// Collect historical data and calculate technical indicators
async function collectHistoricalData(ticker: string): Promise<void> {
  try {
    console.log(`Collecting historical data for ${ticker}`);
    
    const historicalData = await getHistoricalData(ticker, '3mo', '1d');
    if (!historicalData) {
      const error = `Failed to get historical data for ${ticker}`;
      recordError(ticker, 'historical', error);
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
    
    collectionStatus[ticker].lastHistoricalUpdate = Date.now();
    console.log(`Saved historical data and indicators for ${ticker}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    recordError(ticker, 'historical', errorMsg);
  }
}

// Collect options data for a ticker
async function collectOptionsData(ticker: string): Promise<void> {
  try {
    console.log(`Collecting options data for ${ticker}`);
    
    // Get current stock price
    const quoteData = await getQuote(ticker);
    if (!quoteData) {
      const error = `Failed to get quote data for ${ticker}`;
      recordError(ticker, 'options', error);
      return;
    }
    
    // Get options chain
    const optionsChain = await getOptionsChain(ticker);
    if (!optionsChain) {
      const error = `Failed to get options chain for ${ticker}`;
      recordError(ticker, 'options', error);
      return;
    }
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Process options metrics with cached calculation
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
                  (optionsChain.calls.length || 1);
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
    
    // Save options data for each strike
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
    
    collectionStatus[ticker].lastOptionsUpdate = Date.now();
    console.log(`Saved options data for ${ticker}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    recordError(ticker, 'options', errorMsg);
  }
}

// Generate daily summary for a ticker
async function generateDailySummary(ticker: string): Promise<void> {
  try {
    console.log(`Generating daily summary for ${ticker}`);
    
    // Get latest data
    const quoteData = await getQuote(ticker);
    if (!quoteData) {
      const error = `Failed to get quote data for ${ticker}`;
      recordError(ticker, 'daily-summary', error);
      return;
    }
    
    // Get options chain for max pain
    const optionsChain = await getOptionsChain(ticker);
    if (!optionsChain) {
      const error = `Failed to get options chain for ${ticker}`;
      recordError(ticker, 'daily-summary', error);
      return;
    }
    
    // Get historical data for technical indicators
    const historicalData = await getHistoricalData(ticker, '3mo', '1d');
    if (!historicalData) {
      const error = `Failed to get historical data for ${ticker}`;
      recordError(ticker, 'daily-summary', error);
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
                  (optionsChain.calls.length || 1);
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
    
    collectionStatus[ticker].lastDailySummaryUpdate = Date.now();
    console.log(`Saved daily summary for ${ticker}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    recordError(ticker, 'daily-summary', errorMsg);
  }
}

// Record error for monitoring
function recordError(ticker: string, dataType: string, error: string): void {
  console.error(`Error collecting ${dataType} data for ${ticker}:`, error);
  
  if (collectionStatus[ticker]) {
    collectionStatus[ticker].errors.push(`[${new Date().toISOString()}] ${dataType}: ${error}`);
    
    // Keep only last 10 errors
    if (collectionStatus[ticker].errors.length > 10) {
      collectionStatus[ticker].errors.shift();
    }
  }
}

// Get collection status for monitoring
export function getCollectionStatus(): Record<string, any> {
  const now = Date.now();
  
  // Format status with timeAgo
  return Object.entries(collectionStatus).reduce((status, [ticker, data]) => {
    status[ticker] = {
      ...data,
      quoteStatus: getStatusIndicator(now - data.lastQuoteUpdate, QUOTE_INTERVAL_MS * 2),
      historicalStatus: getStatusIndicator(now - data.lastHistoricalUpdate, HISTORICAL_INTERVAL_MS * 2),
      optionsStatus: getStatusIndicator(now - data.lastOptionsUpdate, OPTIONS_INTERVAL_MS * 2),
      dailySummaryStatus: getStatusIndicator(now - data.lastDailySummaryUpdate, DAILY_SUMMARY_INTERVAL_MS * 2),
      lastErrors: data.errors.slice(-3), // Last 3 errors
    };
    return status;
  }, {} as Record<string, any>);
}

// Get status indicator
function getStatusIndicator(timeSinceUpdate: number, threshold: number): string {
  if (timeSinceUpdate === 0) return 'not_started';
  if (timeSinceUpdate > threshold) return 'stale';
  return 'ok';
}

// Export a function to manually trigger collection (useful for testing)
export async function manuallyCollectData(ticker: string): Promise<void> {
  await collectQuoteData(ticker);
  await collectHistoricalData(ticker);
  await collectOptionsData(ticker);
  await generateDailySummary(ticker);
}

// Cleanup function for stopping all data collection
export function cleanupAllCollections(): void {
  console.log('Stopping all data collections');
  
  for (const ticker of Object.keys(quoteTimers)) {
    stopDataCollection(ticker);
  }
  
  if (cacheCleanupTimer) {
    clearInterval(cacheCleanupTimer);
    cacheCleanupTimer = null;
  }
}