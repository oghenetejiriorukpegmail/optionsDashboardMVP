import { NextResponse } from 'next/server';
import * as repository from '@/lib/db/repository';
import { getHistoricalData } from '@/lib/services/marketDataService';
import { createContextLogger } from '@/lib/utils/logger';

const logger = createContextLogger('TechnicalIndicatorsAPI');

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
      const rsiValue = rsiValues[j];
      if (rsiValue !== null) {
        periodValues.push(rsiValue);
      }
    }
    
    if (periodValues.length < period) {
      stochRsi.push(null);
      continue;
    }
    
    const minRsi = Math.min(...periodValues);
    const maxRsi = Math.max(...periodValues);
    const currentRsi = rsiValues[i];
    
    if (currentRsi === null) {
      stochRsi.push(null);
    } else if (maxRsi === minRsi) {
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
    
    // Fetch stock data from database first
    let stockData = await repository.getLatestStockData(symbol);
    
    // If no data in database, try to fetch from external API
    if (!stockData) {
      try {
        logger.info(`No database data found for ${symbol}, fetching from external API`, { symbol });
        const historicalData = await getHistoricalData(symbol, '3mo', '1d');
        
        if (!historicalData || !historicalData.close || historicalData.close.length === 0) {
          logger.error(`No historical data available for ${symbol}`, { symbol });
          return NextResponse.json({
            error: 'No historical data available for this symbol',
            symbol,
            timestamp: new Date().toISOString()
          }, { status: 404 });
        }
        
        // Convert external API data to our format
        const convertedData = [];
        for (let i = 0; i < historicalData.timestamps.length; i++) {
          if (historicalData.close[i] !== null && historicalData.close[i] !== undefined) {
            convertedData.push({
              date: historicalData.dates[i],
              timestamp: historicalData.timestamps[i],
              open: historicalData.open[i] || historicalData.close[i],
              high: historicalData.high[i] || historicalData.close[i],
              low: historicalData.low[i] || historicalData.close[i],
              close: historicalData.close[i],
              volume: historicalData.volume[i] || 0
            });
          }
        }
        
        if (convertedData.length === 0) {
          logger.error(`No valid price data available for ${symbol}`, { symbol });
          return NextResponse.json({
            error: 'No valid price data available for this symbol',
            symbol,
            timestamp: new Date().toISOString()
          }, { status: 404 });
        }
        
        const dataWithIndicators = calculateIndicators(convertedData);
        const latestData = dataWithIndicators[dataWithIndicators.length - 1];
        const price = latestData.close;
        
        const response = buildResponse(symbol, price, dataWithIndicators);
        
        // Cache the data
        indicatorsCache[symbol] = {
          data: response,
          timestamp: now
        };
        
        return NextResponse.json(response);
        
      } catch (error) {
        logger.error(`Failed to fetch external data for ${symbol}`, { symbol }, error as Error);
        return NextResponse.json({
          error: 'Failed to fetch data for this symbol',
          symbol,
          timestamp: new Date().toISOString(),
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }
    }
    
    // Fetch historical data from external API
    let historicalData;
    try {
      logger.info(`Fetching historical data for ${symbol} from external API`, { symbol });
      const externalData = await getHistoricalData(symbol, '3mo', '1d');
      
      if (!externalData || !externalData.close || externalData.close.length < 30) {
        logger.error(`Insufficient external historical data for ${symbol}`, { symbol });
        return NextResponse.json({
          error: 'Insufficient historical data available for technical analysis',
          symbol,
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      
      // Convert external API data to our format
      const convertedData = [];
      for (let i = 0; i < externalData.timestamps.length; i++) {
        if (externalData.close[i] !== null && externalData.close[i] !== undefined) {
          convertedData.push({
            date: externalData.dates[i],
            timestamp: externalData.timestamps[i],
            open: externalData.open[i] || externalData.close[i],
            high: externalData.high[i] || externalData.close[i],
            low: externalData.low[i] || externalData.close[i],
            close: externalData.close[i],
            volume: externalData.volume[i] || 0
          });
        }
      }
      historicalData = convertedData;
      
    } catch (error) {
      logger.error(`Failed to fetch historical data for ${symbol}`, { symbol }, error as Error);
      return NextResponse.json({
        error: 'Failed to fetch historical data for technical analysis',
        symbol,
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
    
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
    logger.error('Error fetching technical indicators', {}, error as Error);
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


// Build the response
function buildResponse(symbol: string, price: number, dataWithIndicators: any[], stockData?: any) {
  const latestData = dataWithIndicators[dataWithIndicators.length - 1];
  
  // Determine trend based on EMAs
  const emaTrend = latestData.ema10 > latestData.ema20 && latestData.ema20 > latestData.ema50 ? '10 > 20 > 50' :
                   latestData.ema10 < latestData.ema20 && latestData.ema20 < latestData.ema50 ? '10 < 20 < 50' :
                   'Mixed';
  
  // Use stock data PCR if available, otherwise null
  const pcr = stockData?.pcr || null;
  
  // Determine setup type based on EMAs only (no PCR dependency)
  const setupType = emaTrend === '10 > 20 > 50' ? 'bullish' :
                    emaTrend === '10 < 20 < 50' ? 'bearish' :
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
      percentChange: null // No historical comparison available
    },
    iv: stockData?.iv || null,
    gex: stockData?.gex || null,
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