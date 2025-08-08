/**
 * Utility functions to convert various data formats to candlestick chart format
 */

interface CandlestickDataPoint {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface YahooFinanceDataPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  adjClose?: number;
  volume?: number;
}

interface ExistingDataPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  ema10?: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
}

/**
 * Convert Yahoo Finance API data to candlestick format
 */
export function convertYahooFinanceData(
  data: YahooFinanceDataPoint[]
): CandlestickDataPoint[] {
  return data.map((point) => ({
    timestamp: new Date(point.date).getTime(),
    date: new Date(point.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    open: point.open || point.close,
    high: point.high || point.close,
    low: point.low || point.close,
    close: point.close,
    volume: point.volume,
  }));
}

/**
 * Convert existing data format to candlestick format
 * Handles cases where OHLC data might be missing
 */
export function convertExistingData(
  data: ExistingDataPoint[]
): CandlestickDataPoint[] {
  return data.map((point, index) => {
    // If OHLC data is missing, estimate it from close price
    const close = point.close;
    const open = point.open || (index > 0 ? data[index - 1].close : close);
    const high = point.high || Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = point.low || Math.min(open, close) * (1 - Math.random() * 0.01);

    return {
      timestamp: new Date(point.date).getTime(),
      date: new Date(point.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      open,
      high,
      low,
      close,
      volume: point.volume,
    };
  });
}

/**
 * Generate synthetic OHLC data from price array
 * Useful when you only have close prices
 */
export function generateOHLCFromPrices(
  prices: number[],
  dates: string[],
  volumes?: number[]
): CandlestickDataPoint[] {
  if (prices.length !== dates.length) {
    throw new Error('Prices and dates arrays must have the same length');
  }

  return prices.map((close, index) => {
    const prevClose = index > 0 ? prices[index - 1] : close;
    
    // Generate realistic OHLC from close price
    const volatility = 0.01 + Math.random() * 0.02; // 1-3% volatility
    const range = close * volatility;
    
    // Open price is close to previous close
    const open = prevClose + (Math.random() - 0.5) * (range * 0.5);
    
    // Generate high and low around the open-close range
    const high = Math.max(open, close) + Math.random() * (range * 0.5);
    const low = Math.min(open, close) - Math.random() * (range * 0.5);

    return {
      timestamp: new Date(dates[index]).getTime(),
      date: new Date(dates[index]).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: volumes?.[index],
    };
  });
}

/**
 * Aggregate intraday data to daily candlesticks
 */
export function aggregateToDaily(
  intradayData: CandlestickDataPoint[]
): CandlestickDataPoint[] {
  if (intradayData.length === 0) return [];

  const dailyData: { [date: string]: CandlestickDataPoint[] } = {};

  // Group data by date
  intradayData.forEach((point) => {
    const dateStr = new Date(point.timestamp).toDateString();
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = [];
    }
    dailyData[dateStr].push(point);
  });

  // Aggregate each day's data
  return Object.entries(dailyData).map(([dateStr, dayData]) => {
    const sortedData = dayData.sort((a, b) => a.timestamp - b.timestamp);
    const firstCandle = sortedData[0];
    const lastCandle = sortedData[sortedData.length - 1];

    return {
      timestamp: new Date(dateStr).getTime(),
      date: new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      open: firstCandle.open,
      high: Math.max(...sortedData.map(d => d.high)),
      low: Math.min(...sortedData.map(d => d.low)),
      close: lastCandle.close,
      volume: sortedData.reduce((sum, d) => sum + (d.volume || 0), 0),
    };
  }).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Resample data to different timeframes
 */
export function resampleData(
  data: CandlestickDataPoint[],
  timeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d'
): CandlestickDataPoint[] {
  if (data.length === 0) return [];

  const timeframeMs = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };

  const interval = timeframeMs[timeframe];
  const resampled: CandlestickDataPoint[] = [];
  
  let currentBucket: CandlestickDataPoint[] = [];
  let bucketStart = Math.floor(data[0].timestamp / interval) * interval;

  for (const point of data) {
    const pointBucket = Math.floor(point.timestamp / interval) * interval;
    
    if (pointBucket !== bucketStart) {
      // Process current bucket
      if (currentBucket.length > 0) {
        const aggregated = aggregateBucket(currentBucket, bucketStart);
        resampled.push(aggregated);
      }
      
      // Start new bucket
      currentBucket = [point];
      bucketStart = pointBucket;
    } else {
      currentBucket.push(point);
    }
  }

  // Process final bucket
  if (currentBucket.length > 0) {
    const aggregated = aggregateBucket(currentBucket, bucketStart);
    resampled.push(aggregated);
  }

  return resampled;
}

/**
 * Helper function to aggregate a bucket of data points
 */
function aggregateBucket(
  bucket: CandlestickDataPoint[],
  bucketStart: number
): CandlestickDataPoint {
  const sorted = bucket.sort((a, b) => a.timestamp - b.timestamp);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  return {
    timestamp: bucketStart,
    date: new Date(bucketStart).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    open: first.open,
    high: Math.max(...sorted.map(d => d.high)),
    low: Math.min(...sorted.map(d => d.low)),
    close: last.close,
    volume: sorted.reduce((sum, d) => sum + (d.volume || 0), 0),
  };
}

/**
 * Calculate technical indicators for candlestick data
 */
export function calculateTechnicalIndicators(data: CandlestickDataPoint[]) {
  const closes = data.map(d => d.close);
  const volumes = data.map(d => d.volume || 0);

  // Simple Moving Average
  const calculateSMA = (prices: number[], period: number): number[] => {
    const sma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  // Exponential Moving Average
  const calculateEMA = (prices: number[], period: number): number[] => {
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    ema[0] = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }
    
    return ema;
  };

  // RSI calculation
  const calculateRSI = (prices: number[], period: number = 14): number[] => {
    const rsi = [];
    const changes = [];
    
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    for (let i = 0; i < changes.length; i++) {
      if (i < period - 1) {
        rsi.push(NaN);
      } else {
        const recentChanges = changes.slice(i - period + 1, i + 1);
        const gains = recentChanges.filter(change => change > 0);
        const losses = recentChanges.filter(change => change < 0).map(loss => -loss);
        
        const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
        
        if (avgLoss === 0) {
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
    }
    
    // Pad with NaN for first price (no change)
    return [NaN, ...rsi];
  };

  return {
    sma20: calculateSMA(closes, 20),
    sma50: calculateSMA(closes, 50),
    ema10: calculateEMA(closes, 10),
    ema20: calculateEMA(closes, 20),
    ema50: calculateEMA(closes, 50),
    rsi: calculateRSI(closes, 14),
    volume: volumes,
  };
}

/**
 * Detect support and resistance levels
 */
export function detectSupportResistance(
  data: CandlestickDataPoint[],
  lookback: number = 20,
  threshold: number = 0.02
): { support: number[]; resistance: number[] } {
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  
  const supportLevels: number[] = [];
  const resistanceLevels: number[] = [];
  
  // Find local minima for support
  for (let i = lookback; i < lows.length - lookback; i++) {
    const currentLow = lows[i];
    const isLocalMin = lows.slice(i - lookback, i + lookback + 1)
      .every(low => low >= currentLow);
    
    if (isLocalMin) {
      // Check if this level is significant (appears multiple times)
      const nearbyTouches = lows.filter(low => 
        Math.abs(low - currentLow) / currentLow < threshold
      ).length;
      
      if (nearbyTouches >= 3) {
        supportLevels.push(currentLow);
      }
    }
  }
  
  // Find local maxima for resistance
  for (let i = lookback; i < highs.length - lookback; i++) {
    const currentHigh = highs[i];
    const isLocalMax = highs.slice(i - lookback, i + lookback + 1)
      .every(high => high <= currentHigh);
    
    if (isLocalMax) {
      // Check if this level is significant (appears multiple times)
      const nearbyTouches = highs.filter(high => 
        Math.abs(high - currentHigh) / currentHigh < threshold
      ).length;
      
      if (nearbyTouches >= 3) {
        resistanceLevels.push(currentHigh);
      }
    }
  }
  
  // Remove duplicates and sort
  const uniqueSupport = [...new Set(supportLevels)].sort((a, b) => b - a);
  const uniqueResistance = [...new Set(resistanceLevels)].sort((a, b) => a - b);
  
  return {
    support: uniqueSupport.slice(0, 3), // Top 3 support levels
    resistance: uniqueResistance.slice(-3), // Top 3 resistance levels
  };
}