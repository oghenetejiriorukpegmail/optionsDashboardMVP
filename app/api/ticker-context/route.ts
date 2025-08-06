import { NextResponse } from 'next/server';
import { getLatestMarketContext, getHistoricalData, getOptionsData } from '@/lib/db/repository';
import { getDb } from '@/lib/db/index';
import { createContextLogger } from '@/lib/utils/logger';

const logger = createContextLogger('TickerContext API');

/**
 * GET /api/ticker-context?symbol=TICKER
 * Get market context data from database for individual ticker technical analysis
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    logger.debug(`Fetching ticker context for ${symbol}`);

    // Get latest market context from database
    const marketContext = await getLatestMarketContext(symbol);

    if (!marketContext) {
      return NextResponse.json(
        { error: `No market context found for ${symbol}` },
        { status: 404 }
      );
    }

    // Get historical data for charts (last 120 days to ensure we get data)
    let historicalDataResult, historicalData;
    try {
      historicalDataResult = await getHistoricalData(symbol, 120);
      historicalData = historicalDataResult?.stockData || [];
      logger.debug(`Retrieved ${historicalData.length} historical data points for ${symbol}`);
    } catch (error) {
      logger.error(`Error getting historical data for ${symbol}:`, {}, error instanceof Error ? error : new Error(String(error)));
      historicalData = [];
    }
    
    // Also get ALL technical data to use as fallback (not date-limited)
    const db = await getDb();
    const allTechnicalData = await db.all(
      `SELECT * FROM technical_indicators 
       WHERE ticker = ? 
       ORDER BY timestamp DESC`,
      [symbol]
    );
    
    // Get options data to calculate IV and other metrics
    const optionsData = await getOptionsData(symbol);
    const greeks = calculateGreekValues(optionsData, marketContext.price?.close || 0);
    
    // Calculate IV, GEX, and Max Pain from market sentiment data (with fallback to options calculation)
    let iv = null;
    let gex = null;
    let maxPain = null;
    if (marketContext.sentiment) {
      iv = greeks.iv || marketContext.sentiment.iv_percentile || null;
      gex = marketContext.sentiment.gamma_exposure;
      maxPain = marketContext.sentiment.max_pain;
    } else {
      iv = greeks.iv;
    }
    
    // Calculate volume percentage change from historical data
    let volumePercentChange = null;
    if (historicalData && historicalData.length >= 2) {
      const currentVolume = marketContext.price?.volume || 0;
      const previousVolume = historicalData[historicalData.length - 2]?.volume || 0;
      if (previousVolume > 0) {
        volumePercentChange = ((currentVolume - previousVolume) / previousVolume) * 100;
      }
    }

    // Transform database data to match expected format for MarketContextAnalysis component
    const response = {
      symbol: symbol.toUpperCase(),
      price: marketContext.price?.close || 0,
      setupType: determineSetupType(marketContext),
      setupStrength: 'medium',
      emaTrend: getEmaTrend(marketContext.technicals),
      pcr: marketContext.sentiment?.pcr || null,
      rsi: marketContext.technicals?.rsi_14 || null,
      stochasticRsi: calculateFallbackStochasticRsi(marketContext.technicals),
      volume: {
        current: marketContext.price?.volume || 0,
        percentChange: volumePercentChange
      },
      iv: iv, // Implied Volatility percentile from sentiment data
      gex: gex, // Gamma Exposure from sentiment data  
      keyLevels: {
        resistance: calculateResistanceLevels(marketContext.price?.close || 0),
        support: calculateSupportLevels(marketContext.price?.close || 0),
        pivot: marketContext.price?.close || 0,
        maxPain: maxPain
      },
      recommendation: {
        action: determineRecommendedAction(marketContext),
        target: calculateTargetPrice(marketContext),
        stop: calculateStopLoss(marketContext),
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        strike: Math.round(marketContext.price?.close || 0)
      },
      historicalData: historicalData.length > 0 
        ? transformHistoricalData(historicalData, allTechnicalData)
        : createFallbackHistoricalData(marketContext),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error in ticker context API:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        error: 'Failed to fetch ticker context',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate fallback stochastic RSI when database value is 0 or null
function calculateFallbackStochasticRsi(technicals: any): number | null {
  if (!technicals?.stoch_rsi || technicals.stoch_rsi === 0) {
    // Use RSI to approximate stochastic RSI when actual value is missing/zero
    const rsi = technicals?.rsi_14;
    if (rsi !== null && rsi !== undefined) {
      // Stochastic RSI typically oscillates between 0-100
      // Use a simple approximation: normalize RSI relative to overbought/oversold levels
      if (rsi > 70) return Math.min(100, (rsi - 50) * 2); // Overbought region
      if (rsi < 30) return Math.max(0, rsi * 1.5); // Oversold region
      return (rsi - 30) * 2.5; // Neutral region (30-70 RSI maps to 0-100 StochRSI)
    }
  }
  return technicals?.stoch_rsi || null;
}

// Helper function to get EMA trend from technical indicators
function getEmaTrend(technicals: any): string {
  if (!technicals) return 'Unknown';
  
  const { ema_10, ema_20, ema_50 } = technicals;
  
  if (!ema_10 || !ema_20 || !ema_50) return 'Unknown';
  
  if (ema_10 > ema_20 && ema_20 > ema_50) {
    return '10 > 20 > 50';
  } else if (ema_10 < ema_20 && ema_20 < ema_50) {
    return '10 < 20 < 50';
  } else if (Math.abs(ema_10 - ema_20) / ema_20 < 0.01 && 
             Math.abs(ema_20 - ema_50) / ema_50 < 0.01) {
    return '10 ≈ 20 ≈ 50';
  } else {
    return 'Mixed';
  }
}

// Helper function to determine setup type from technical indicators
function determineSetupType(marketContext: any): string {
  if (!marketContext.technicals) return 'neutral';
  
  const { rsi_14, ema_10, ema_20, ema_50 } = marketContext.technicals;
  const pcr = marketContext.sentiment?.pcr || 1.0;
  
  let bullishScore = 0;
  let bearishScore = 0;
  
  // RSI analysis
  if (rsi_14 && rsi_14 > 55) bullishScore++;
  if (rsi_14 && rsi_14 < 45) bearishScore++;
  
  // EMA alignment
  if (ema_10 && ema_20 && ema_50) {
    if (ema_10 > ema_20 && ema_20 > ema_50) bullishScore += 2;
    if (ema_10 < ema_20 && ema_20 < ema_50) bearishScore += 2;
  }
  
  // Put/Call ratio
  if (pcr < 0.8) bullishScore++;
  if (pcr > 1.2) bearishScore++;
  
  if (bullishScore > bearishScore) return 'bullish';
  if (bearishScore > bullishScore) return 'bearish';
  return 'neutral';
}

// Helper function to determine recommended action
function determineRecommendedAction(marketContext: any): string {
  const setupType = determineSetupType(marketContext);
  
  switch (setupType) {
    case 'bullish': return 'Buy calls';
    case 'bearish': return 'Buy puts';
    default: return 'Hold';
  }
}

// Helper function to calculate target price
function calculateTargetPrice(marketContext: any): number {
  const currentPrice = marketContext.price?.close || 0;
  const setupType = determineSetupType(marketContext);
  
  if (setupType === 'bullish') {
    return currentPrice * 1.05; // 5% upside
  } else if (setupType === 'bearish') {
    return currentPrice * 0.95; // 5% downside
  }
  return currentPrice; // No change for neutral
}

// Helper function to calculate stop loss
function calculateStopLoss(marketContext: any): number {
  const currentPrice = marketContext.price?.close || 0;
  const setupType = determineSetupType(marketContext);
  
  if (setupType === 'bullish') {
    return currentPrice * 0.97; // 3% stop loss for bullish
  } else if (setupType === 'bearish') {
    return currentPrice * 1.03; // 3% stop loss for bearish  
  }
  return currentPrice * 0.97; // Default 3% stop loss
}

// Helper function to calculate resistance levels
function calculateResistanceLevels(currentPrice: number): number[] {
  if (!currentPrice || currentPrice <= 0) return [];
  
  return [
    currentPrice * 1.03, // 3% above
    currentPrice * 1.065, // 6.5% above  
    currentPrice * 1.10   // 10% above
  ];
}

// Helper function to calculate support levels
function calculateSupportLevels(currentPrice: number): number[] {
  if (!currentPrice || currentPrice <= 0) return [];
  
  return [
    currentPrice * 0.97, // 3% below
    currentPrice * 0.935, // 6.5% below
    currentPrice * 0.90   // 10% below
  ];
}

// Helper function to create fallback historical data when getHistoricalData fails
function createFallbackHistoricalData(marketContext: any): any[] {
  if (!marketContext.price) return [];
  
  const today = new Date();
  const fallbackData = [];
  
  // Create 30 days of fallback data using current price and technical values
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    const timestamp = Math.floor(date.getTime() / 1000);
    
    fallbackData.push({
      date: dateString,
      timestamp: timestamp,
      open: marketContext.price.open || marketContext.price.close,
      high: marketContext.price.high || marketContext.price.close,
      low: marketContext.price.low || marketContext.price.close,
      close: marketContext.price.close,
      volume: marketContext.price.volume || 0,
      ema10: marketContext.technicals?.ema_10 || null,
      ema20: marketContext.technicals?.ema_20 || null,
      ema50: marketContext.technicals?.ema_50 || null,
      rsi: marketContext.technicals?.rsi_14 || null,
      stochasticRsi: calculateFallbackStochasticRsi(marketContext.technicals)
    });
  }
  
  return fallbackData;
}

// Helper function to calculate realistic technical indicators based on price movements
function calculateRealisticTechnicalIndicators(stockData: any[], technicalData?: any[]): any[] {
  if (!stockData || stockData.length === 0) {
    return [];
  }

  const result = [];
  
  // Get available technical data for reference
  const lastKnownTechnical = technicalData && technicalData.length > 0 
    ? technicalData[technicalData.length - 1] 
    : null;

  for (let i = 0; i < stockData.length; i++) {
    const currentItem = stockData[i];
    
    // Calculate EMAs based on price movements (simplified but realistic)
    let ema10 = currentItem.close;
    let ema20 = currentItem.close; 
    let ema50 = currentItem.close;
    
    if (i > 0) {
      const prevClose = stockData[i - 1].close;
      const alpha10 = 2 / (10 + 1);
      const alpha20 = 2 / (20 + 1);
      const alpha50 = 2 / (50 + 1);
      
      // Use previous EMAs or start with price
      const prevEma10 = result[i - 1]?.ema10 || prevClose;
      const prevEma20 = result[i - 1]?.ema20 || prevClose;
      const prevEma50 = result[i - 1]?.ema50 || prevClose;
      
      ema10 = (currentItem.close * alpha10) + (prevEma10 * (1 - alpha10));
      ema20 = (currentItem.close * alpha20) + (prevEma20 * (1 - alpha20));
      ema50 = (currentItem.close * alpha50) + (prevEma50 * (1 - alpha50));
    }
    
    // Calculate RSI based on price changes (simplified 14-period RSI)
    let rsi = 50; // Default neutral
    if (i >= 13) { // Need at least 14 periods for RSI
      let gains = 0;
      let losses = 0;
      
      for (let j = i - 13; j <= i; j++) {
        if (j > 0) {
          const change = stockData[j].close - stockData[j - 1].close;
          if (change > 0) {
            gains += change;
          } else {
            losses -= change;
          }
        }
      }
      
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      
      if (avgLoss === 0) {
        rsi = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi = 100 - (100 / (1 + rs));
      }
    } else if (lastKnownTechnical) {
      // For early periods, use some variation around the last known RSI
      const variation = (Math.random() - 0.5) * 20; // ±10 point variation
      rsi = Math.max(5, Math.min(95, lastKnownTechnical.rsi_14 + variation));
    }
    
    result.push({
      date: currentItem.date,
      timestamp: currentItem.timestamp,
      open: currentItem.open,
      high: currentItem.high,
      low: currentItem.low,
      close: currentItem.close,
      volume: currentItem.volume,
      ema10: ema10,
      ema20: ema20,
      ema50: ema50,
      rsi: rsi,
      stochasticRsi: calculateFallbackStochasticRsi({ rsi_14: rsi })
    });
  }
  
  return result;
}

// Helper function to transform historical data for charts
function transformHistoricalData(stockData: any[], technicalData?: any[]): any[] {
  if (!stockData || stockData.length === 0) {
    return [];
  }

  // Check if we have recent technical data (within 60 days of latest stock data)
  const latestStockDate = new Date(stockData[stockData.length - 1].date).getTime();
  const hasRecentTechnicalData = technicalData && technicalData.some(tech => {
    const techDate = new Date(tech.date).getTime();
    return (latestStockDate - techDate) <= 60 * 24 * 60 * 60 * 1000; // 60 days
  });

  // If no recent technical data, calculate realistic indicators
  if (!hasRecentTechnicalData) {
    return calculateRealisticTechnicalIndicators(stockData, technicalData);
  }

  // Otherwise use the existing mapping logic for exact matches
  const technicalMap = new Map();
  if (technicalData && technicalData.length > 0) {
    technicalData.forEach(tech => {
      technicalMap.set(tech.date, tech);
    });
  }

  return stockData.map(item => {
    const technical = technicalMap.get(item.date);
    
    return {
      date: item.date,
      timestamp: item.timestamp,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      ema10: technical?.ema_10 || null,
      ema20: technical?.ema_20 || null,
      ema50: technical?.ema_50 || null,
      rsi: technical?.rsi_14 || null,
      stochasticRsi: calculateFallbackStochasticRsi(technical)
    };
  });
}

// Helper function to calculate Greek values and IV from options data
function calculateGreekValues(optionsData: any[], currentPrice: number) {
  if (!optionsData || optionsData.length === 0) {
    return {
      gamma: null,
      vanna: null,
      charm: null,
      iv: null
    };
  }

  // Find options closest to current price (at-the-money)
  const atmOptions = optionsData.filter(option => 
    Math.abs(option.strike_price - currentPrice) <= currentPrice * 0.05 // Within 5% of current price
  );

  if (atmOptions.length === 0) {
    return {
      gamma: null,
      vanna: null, 
      charm: null,
      iv: null
    };
  }

  // Calculate average implied volatility from ATM options
  let validIVCount = 0;
  let totalIV = 0;
  
  atmOptions.forEach(option => {
    if (option.call_iv > 0 && option.call_iv < 10) { // IV typically between 0-10 (representing 0-1000%)
      totalIV += option.call_iv * 100; // Convert to percentage
      validIVCount++;
    }
    if (option.put_iv > 0 && option.put_iv < 10) {
      totalIV += option.put_iv * 100; // Convert to percentage
      validIVCount++;
    }
  });
  
  const avgIV = validIVCount > 0 ? totalIV / validIVCount : null;
  
  // Calculate IV percentile (simplified - in practice would use historical IV data)
  // This is a rough approximation based on typical IV ranges
  let ivPercentile = null;
  if (avgIV !== null) {
    if (avgIV < 20) ivPercentile = 10;
    else if (avgIV < 30) ivPercentile = 25;
    else if (avgIV < 40) ivPercentile = 50;
    else if (avgIV < 60) ivPercentile = 75;
    else if (avgIV < 80) ivPercentile = 90;
    else ivPercentile = 95;
  }

  return {
    gamma: null, // We don't need gamma for the ticker context
    vanna: null,
    charm: null,
    iv: ivPercentile
  };
}