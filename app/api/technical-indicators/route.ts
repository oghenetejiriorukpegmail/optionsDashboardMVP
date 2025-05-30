import { NextResponse } from 'next/server';
import * as repository from '@/lib/db/repository';

// Cache for technical indicator data
const indicatorsCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper functions for technical indicators
function calculateEMA(closes: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const ema: (number | null)[] = [];
  
  if (closes.length < period) return Array(closes.length).fill(null);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  ema[period - 1] = sum / period;
  
  // Calculate rest of EMAs
  for (let i = period; i < closes.length; i++) {
    const prevEma = ema[i - 1];
    if (prevEma !== null) {
      ema[i] = closes[i] * k + prevEma * (1 - k);
    }
  }
  
  // Fill initial values with null
  for (let i = 0; i < period - 1; i++) {
    ema[i] = null;
  }
  
  return ema;
}

function calculateRSI(closes: number[], period: number = 14): (number | null)[] {
  if (closes.length < period + 1) return Array(closes.length).fill(null);
  
  const rsi: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial average gain/loss
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;
  
  // Fill initial values
  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }
  
  // Calculate RSI values
  for (let i = period; i < closes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
}

function calculateStochasticRSI(rsiValues: (number | null)[], period: number = 14): (number | null)[] {
  const stochRsi: (number | null)[] = [];
  
  for (let i = 0; i < rsiValues.length; i++) {
    if (i < period - 1 || rsiValues[i] === null) {
      stochRsi.push(null);
      continue;
    }
    
    // Get RSI values for the period
    const periodValues: number[] = [];
    for (let j = i - period + 1; j <= i; j++) {
      if (rsiValues[j] !== null) {
        periodValues.push(rsiValues[j]);
      }
    }
    
    if (periodValues.length < period) {
      stochRsi.push(null);
      continue;
    }
    
    const minRsi = Math.min(...periodValues);
    const maxRsi = Math.max(...periodValues);
    const currentRsi = rsiValues[i];
    
    if (maxRsi === minRsi) {
      stochRsi.push(50); // Middle value when range is 0
    } else {
      stochRsi.push(((currentRsi - minRsi) / (maxRsi - minRsi)) * 100);
    }
  }
  
  return stochRsi;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const refresh = searchParams.get('refresh') === 'true';
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }
    
    // Check if we have valid cached data
    const now = Date.now();
    if (!refresh && indicatorsCache[symbol] && now - indicatorsCache[symbol].timestamp < CACHE_DURATION) {
      return NextResponse.json(indicatorsCache[symbol].data);
    }
    
    // Fetch stock data from database
    const stockData = await repository.getLatestStockData(symbol);
    if (!stockData) {
      // Try to generate mock data for the ticker
      const historicalData = generateMockHistoricalData(symbol);
      const dataWithIndicators = calculateIndicators(historicalData);
      
      const latestData = dataWithIndicators[dataWithIndicators.length - 1];
      const price = latestData.close;
      
      const response = buildResponse(symbol, price, dataWithIndicators);
      
      // Cache the data
      indicatorsCache[symbol] = {
        data: response,
        timestamp: now
      };
      
      return NextResponse.json(response);
    }
    
    // Generate historical data based on current price
    const historicalData = generateHistoricalDataFromStock(stockData);
    const dataWithIndicators = calculateIndicators(historicalData);
    
    const response = buildResponse(
      symbol, 
      stockData.close || stockData.price || 100, 
      dataWithIndicators,
      stockData
    );
    
    // Cache the data
    indicatorsCache[symbol] = {
      data: response,
      timestamp: now
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching technical indicators:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'Failed to fetch technical indicators',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper to calculate technical indicators from historical data
function calculateIndicators(historicalData: any[]) {
  const sortedData = [...historicalData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const closes = sortedData.map(d => d.close);
  
  // Calculate EMAs
  const ema10 = calculateEMA(closes, 10);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  
  // Calculate RSI
  const rsi = calculateRSI(closes, 14);
  
  // Calculate Stochastic RSI
  const stochRsi = calculateStochasticRSI(rsi, 14);
  
  // Combine with original data
  return sortedData.map((item, index) => ({
    ...item,
    ema10: ema10[index] || null,
    ema20: ema20[index] || null,
    ema50: ema50[index] || null,
    rsi: rsi[index] || null,
    stochasticRsi: stochRsi[index] || null
  }));
}

// Generate mock historical data
function generateMockHistoricalData(symbol: string, days: number = 90): any[] {
  const data = [];
  const basePrice = 100 + Math.random() * 400; // Random base price between 100-500
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Random walk with trend
    const change = (Math.random() - 0.48) * 0.02 * currentPrice; // Slight upward bias
    currentPrice = Math.max(currentPrice + change, basePrice * 0.5); // Don't go below 50% of base
    
    const high = currentPrice * (1 + Math.random() * 0.02);
    const low = currentPrice * (1 - Math.random() * 0.02);
    const open = currentPrice + (Math.random() - 0.5) * 0.01 * currentPrice;
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      open: open,
      high: high,
      low: low,
      close: currentPrice,
      volume: Math.floor(10000000 + Math.random() * 50000000)
    });
  }
  
  return data;
}

// Generate historical data from stock data
function generateHistoricalDataFromStock(stockData: any, days: number = 90): any[] {
  const data = [];
  const basePrice = stockData.close || stockData.price || 100;
  let currentPrice = basePrice;
  
  // Work backwards from current price
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate price that trends toward current price
    const daysLeft = i;
    const volatility = 0.02 * (1 + daysLeft / days); // Higher volatility further back
    const trendFactor = i === 0 ? 0 : (Math.random() - 0.5) * volatility;
    
    const dayPrice = i === 0 ? basePrice : currentPrice * (1 + trendFactor);
    const high = dayPrice * (1 + Math.random() * 0.01);
    const low = dayPrice * (1 - Math.random() * 0.01);
    const open = dayPrice + (Math.random() - 0.5) * 0.005 * dayPrice;
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      open: open,
      high: high,
      low: low,
      close: dayPrice,
      volume: Math.floor((stockData.volume || 10000000) * (0.8 + Math.random() * 0.4))
    });
    
    currentPrice = dayPrice;
  }
  
  return data;
}

// Build the response
function buildResponse(symbol: string, price: number, dataWithIndicators: any[], stockData?: any) {
  const latestData = dataWithIndicators[dataWithIndicators.length - 1];
  
  // Determine trend based on EMAs
  const emaTrend = latestData.ema10 > latestData.ema20 && latestData.ema20 > latestData.ema50 ? '10 > 20 > 50' :
                   latestData.ema10 < latestData.ema20 && latestData.ema20 < latestData.ema50 ? '10 < 20 < 50' :
                   'Mixed';
  
  // Use stock data PCR if available, otherwise mock
  const pcr = stockData?.pcr || (0.8 + Math.random() * 0.8);
  
  // Determine setup type
  const setupType = emaTrend === '10 > 20 > 50' && pcr < 1.0 ? 'bullish' :
                    emaTrend === '10 < 20 < 50' && pcr > 1.2 ? 'bearish' :
                    'neutral';
  
  // Calculate key levels
  const highs = dataWithIndicators.map(d => d.high);
  const lows = dataWithIndicators.map(d => d.low);
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const range = maxHigh - minLow;
  
  const keyLevels = {
    resistance: [
      price + range * 0.1,
      price + range * 0.2,
      price + range * 0.3
    ],
    support: [
      price - range * 0.1,
      price - range * 0.2,
      price - range * 0.3
    ],
    pivot: price
  };
  
  return {
    symbol,
    price,
    setupType,
    setupStrength: latestData.rsi > 70 || latestData.rsi < 30 ? 'high' : 
                   latestData.rsi > 60 || latestData.rsi < 40 ? 'medium' : 'low',
    emaTrend,
    pcr,
    rsi: latestData.rsi,
    stochasticRsi: latestData.stochasticRsi,
    volume: {
      current: stockData?.volume || latestData.volume,
      percentChange: 0 // Mock value
    },
    iv: stockData?.iv || (30 + Math.abs(pcr - 1) * 40),
    gex: stockData?.gex || (setupType === 'bullish' ? 500000000 : setupType === 'bearish' ? -500000000 : 0),
    keyLevels,
    recommendation: {
      action: setupType === 'bullish' ? 'Buy calls' : setupType === 'bearish' ? 'Buy puts' : 'Sell iron condor',
      target: setupType === 'bullish' ? keyLevels.resistance[0] : 
              setupType === 'bearish' ? keyLevels.support[0] : '50% premium',
      stop: setupType === 'bullish' ? keyLevels.support[0] : 
            setupType === 'bearish' ? keyLevels.resistance[0] : 
            `Price breaks ${keyLevels.resistance[0].toFixed(2)}/${keyLevels.support[0].toFixed(2)}`,
      expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      strike: Math.round(price)
    },
    historicalData: dataWithIndicators
  };
}