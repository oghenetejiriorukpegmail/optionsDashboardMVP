import { NextResponse } from 'next/server';
import { 
  getAllTickers, 
  getLatestMarketContext, 
  getOptionsData, 
  getTradeSetups
} from '@/lib/db/repository';
import { analyzeTradeSetups, batchAnalyzeSetups } from '@/lib/services/strategyAnalyzer';
import { manuallyCollectData } from '@/lib/services/dataCollector';
import { createContextLogger } from '@/lib/utils/logger';

const logger = createContextLogger('Scanner API');

/**
 * GET /api/scanner - Scanner endpoint that reads from database and runs analysis
 * Query parameters:
 * - symbol (optional): Specific ticker to analyze
 * - setupType (optional): Filter by setup type (bullish, bearish, neutral)
 * - limit (optional): Limit number of tickers to analyze (default: 20)
 * - refresh (optional): Force fresh analysis (default: false)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const setupType = searchParams.get('setupType');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const refresh = searchParams.get('refresh') === 'true';
    
    // If symbol is provided, analyze only that ticker
    if (symbol) {
      let setup;
      
      // Check if we have recent market data for this symbol
      const marketContext = await getLatestMarketContext(symbol);
      const hasRecentData = marketContext && marketContext.price && 
        (Date.now() - marketContext.price.timestamp * 1000) < 24 * 60 * 60 * 1000; // Less than 24 hours old
      
      // If no recent data or refresh requested, collect fresh data
      if (!hasRecentData || refresh) {
        logger.info(`Collecting fresh data for ${symbol} before analysis`);
        try {
          await manuallyCollectData(symbol);
          logger.info(`Data collection completed for ${symbol}`);
        } catch (error) {
          logger.error(`Failed to collect data for ${symbol}`, {}, error instanceof Error ? error : new Error(String(error)));
          return NextResponse.json({ 
            error: `Failed to collect data for ${symbol}`,
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString() 
          }, { status: 500 });
        }
      }
      
      if (refresh) {
        // Force a new analysis after collecting fresh data
        setup = await analyzeTradeSetups(symbol);
      } else {
        // Get existing trade setup from database
        const setups = await getTradeSetups(symbol);
        setup = setups.length > 0 ? setups[0] : null;
        
        // If no setup found, run analysis
        if (!setup) {
          setup = await analyzeTradeSetups(symbol);
        }
      }
      
      if (!setup) {
        return NextResponse.json({ 
          message: `No trade setup found for ${symbol}`, 
          timestamp: new Date().toISOString() 
        });
      }
      
      // Transform the setup data to match the frontend expectations
      const latestContext = await getLatestMarketContext(symbol);
      
      // Clean up invalid values before returning
      let stopLoss = setup.stop_loss;
      let targetPrice = setup.target_price;
      let riskRewardRatio = setup.risk_reward_ratio;
      
      // Fix invalid stop loss values
      if (!isFinite(stopLoss) || stopLoss === null || stopLoss <= 0) {
        const currentPrice = latestContext?.price?.close || setup.entry_price;
        stopLoss = currentPrice * 0.97; // 3% below current price as fallback
      }
      
      // Fix invalid target price values and ensure meaningful difference
      const minDifferencePercent = 0.02; // Minimum 2% difference required
      const targetPriceDifference = Math.abs(targetPrice - setup.entry_price) / setup.entry_price;
      
      if (!targetPrice || !isFinite(targetPrice) || targetPrice === null || targetPrice === undefined || targetPriceDifference < minDifferencePercent) {
        // For bearish setups, target should be below entry price
        if (setup.setup_type === 'bearish') {
          targetPrice = setup.entry_price * 0.95; // 5% below entry price for bearish
        } else {
          targetPrice = setup.entry_price * 1.05; // 5% above entry price for bullish/neutral
        }
      }
      
      // Always recalculate risk-reward ratio with corrected values
      const reward = Math.abs(targetPrice - setup.entry_price);
      const risk = Math.abs(setup.entry_price - stopLoss);
      riskRewardRatio = risk > 0 && isFinite(reward) && isFinite(risk) ? reward / risk : 1.0;

      // Get options data to calculate Greek values
      const optionsData = await getOptionsData(setup.ticker);
      const greeks = calculateGreekValues(optionsData, latestContext?.price?.close || setup.entry_price);

      const result = {
        symbol: setup.ticker,
        setupType: setup.setup_type,
        emaTrend: getEmaTrend(latestContext?.technicals),
        pcr: latestContext?.sentiment?.pcr || 0,
        rsi: latestContext?.technicals?.rsi_14 || 0,
        setupStrength: getSetupStrength(setup.strength),
        price: latestContext?.price?.close || 0,
        entryPrice: setup.entry_price,
        stopLoss: Number(stopLoss.toFixed(2)),
        targetPrice: Number(targetPrice.toFixed(2)),
        riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
        iv: greeks.iv || latestContext?.sentiment?.iv_percentile || null,
        gamma: greeks.gamma,
        vanna: greeks.vanna,
        charm: greeks.charm,
        stoch_rsi: latestContext?.technicals?.stoch_rsi || null,
      };
      
      return NextResponse.json({ 
        timestamp: new Date().toISOString(),
        setup: result
      });
    }
    
    // Get all tickers or limited set
    let tickers = await getAllTickers();
    
    // Apply limit
    if (limit && limit < tickers.length) {
      tickers = tickers.slice(0, limit);
    }
    
    // Batch analyze all tickers
    const setupResults = await batchAnalyzeSetups(tickers);
    
    // Transform results to match frontend expectations
    const results = [];
    
    for (const [ticker, setup] of Object.entries(setupResults)) {
      if (!setup) continue;
      
      // Skip if setupType filter is applied and doesn't match
      if (setupType && setup.setup_type !== setupType) continue;
      
      const marketContext = await getLatestMarketContext(ticker);
      
      // Clean up invalid values before adding to results
      let stopLoss = setup.stop_loss;
      let targetPrice = setup.target_price;
      let riskRewardRatio = setup.risk_reward_ratio;
      
      // Fix invalid stop loss values
      if (!isFinite(stopLoss) || stopLoss === null || stopLoss <= 0) {
        const currentPrice = marketContext?.price?.close || setup.entry_price;
        stopLoss = currentPrice * 0.97; // 3% below current price as fallback
      }
      
      // Fix invalid target price values and ensure meaningful difference
      const minDifferencePercent = 0.02; // Minimum 2% difference required
      const targetPriceDifference = Math.abs(targetPrice - setup.entry_price) / setup.entry_price;
      
      if (!targetPrice || !isFinite(targetPrice) || targetPrice === null || targetPrice === undefined || targetPriceDifference < minDifferencePercent) {
        // For bearish setups, target should be below entry price
        if (setup.setup_type === 'bearish') {
          targetPrice = setup.entry_price * 0.95; // 5% below entry price for bearish
        } else {
          targetPrice = setup.entry_price * 1.05; // 5% above entry price for bullish/neutral
        }
      }
      
      // Always recalculate risk-reward ratio with corrected values
      const reward = Math.abs(targetPrice - setup.entry_price);
      const risk = Math.abs(setup.entry_price - stopLoss);
      riskRewardRatio = risk > 0 && isFinite(reward) && isFinite(risk) ? reward / risk : 1.0;

      // Get options data to calculate Greek values
      const optionsData = await getOptionsData(ticker);
      const greeks = calculateGreekValues(optionsData, marketContext?.price?.close || setup.entry_price);

      results.push({
        symbol: ticker,
        setupType: setup.setup_type,
        emaTrend: getEmaTrend(marketContext?.technicals),
        pcr: marketContext?.sentiment?.pcr || 0,
        rsi: marketContext?.technicals?.rsi_14 || 0,
        setupStrength: getSetupStrength(setup.strength),
        price: marketContext?.price || 0,
        entryPrice: setup.entry_price,
        stopLoss: Number(stopLoss.toFixed(2)),
        targetPrice: Number(targetPrice.toFixed(2)),
        riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
        iv: greeks.iv || marketContext?.sentiment?.iv_percentile || null,
        gamma: greeks.gamma,
        vanna: greeks.vanna,
        charm: greeks.charm,
        stoch_rsi: marketContext?.technicals?.stoch_rsi || null,
      });
    }
    
    // Count setup types
    const setupCounts = {
      bullish: results.filter(r => r.setupType === 'bullish').length,
      bearish: results.filter(r => r.setupType === 'bearish').length,
      neutral: results.filter(r => r.setupType === 'neutral').length,
    };
    
    // Calculate market summary based on setup counts and average metrics
    const marketSummary = await calculateMarketSummary(results);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      setupCounts,
      results,
      marketSummary,
      limit,
      dataSource: 'database'
    });
  } catch (error) {
    logger.error('Error in scanner API:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        error: 'Scanner operation failed', 
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to get EMA trend from technical indicators
function getEmaTrend(technicals: any) {
  if (!technicals) return 'Unknown';
  
  const { ema_10, ema_20, ema_50 } = technicals;
  
  if (ema_10 > ema_20 && ema_20 > ema_50) {
    return 'Bullish (10 > 20 > 50)';
  } else if (ema_10 < ema_20 && ema_20 < ema_50) {
    return 'Bearish (10 < 20 < 50)';
  } else if (Math.abs(ema_10 - ema_20) / ema_20 < 0.01 && 
             Math.abs(ema_20 - ema_50) / ema_50 < 0.01) {
    return 'Neutral (10 ≈ 20 ≈ 50)';
  } else {
    return 'Mixed';
  }
}

// Helper function to get setup strength based on score
function getSetupStrength(strength: number) {
  if (strength >= 80) return 'strong';
  if (strength >= 65) return 'moderate';
  return 'weak';
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

  // Calculate aggregate gamma (sum of call and put gamma for ATM strikes)
  const totalGamma = atmOptions.reduce((sum, option) => {
    const callGamma = option.call_gamma || 0;
    const putGamma = option.put_gamma || 0;
    return sum + callGamma + Math.abs(putGamma); // Put gamma is negative, so we take absolute value
  }, 0);

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

  // Simplified vanna calculation (gamma sensitivity to IV changes)
  const vanna = totalGamma * ((avgIV || 50) / 100) * 0.5; // Simplified approximation

  // Simplified charm calculation (delta decay with time)
  // Charm is typically negative for long positions, positive for short
  const avgDelta = atmOptions.reduce((sum, option) => sum + Math.abs(option.call_delta || 0), 0) / atmOptions.length;
  const charm = -avgDelta * 0.1; // Simplified time decay approximation

  return {
    gamma: totalGamma > 0 ? Number(totalGamma.toFixed(4)) : null,
    vanna: !isNaN(vanna) && isFinite(vanna) ? Number(vanna.toFixed(4)) : null,
    charm: !isNaN(charm) && isFinite(charm) ? Number(charm.toFixed(4)) : null,
    iv: ivPercentile
  };
}


// Calculate market summary based on setup counts and average metrics
async function calculateMarketSummary(results: any[]) {
  // Calculate PCR aggregate (average of PCRs)
  const pcrValues = results.map(r => r.pcr).filter(pcr => pcr > 0);
  const pcrAggregate = pcrValues.length > 0 
    ? Number((pcrValues.reduce((sum, pcr) => sum + pcr, 0) / pcrValues.length).toFixed(2))
    : 1.0;
  
  // Calculate gamma exposure
  // Note: In a real implementation, this would be a sum of all gamma exposure
  // Here we're using a simplified approach based on setup counts
  const bullishCount = results.filter(r => r.setupType === 'bullish').length;
  const bearishCount = results.filter(r => r.setupType === 'bearish').length;
  const gexBase = 1000 + 100 * results.length;
  const gexMultiplier = bullishCount > bearishCount ? 1 : bullishCount < bearishCount ? -1 : 0.2;
  const gexAdjustment = (bullishCount - bearishCount) * 100;
  const gammaExposure = Math.round((gexBase + gexAdjustment) * gexMultiplier);
  
  // Determine market sentiment
  let sentiment;
  if (bullishCount > bearishCount * 2) {
    sentiment = 'Strongly Bullish';
  } else if (bullishCount > bearishCount) {
    sentiment = 'Moderately Bullish';
  } else if (bearishCount > bullishCount * 2) {
    sentiment = 'Strongly Bearish';
  } else if (bearishCount > bullishCount) {
    sentiment = 'Moderately Bearish';
  } else {
    sentiment = 'Neutral';
  }
  
  // Determine market volatility
  const avgRsi = results.reduce((sum, r) => sum + r.rsi, 0) / (results.length || 1);
  let volatility;
  
  if (avgRsi > 70 || avgRsi < 30) {
    volatility = 'High';
  } else if (avgRsi > 65 || avgRsi < 35) {
    volatility = 'Moderate';
  } else {
    volatility = 'Low';
  }
  
  return {
    sentiment,
    volatility,
    gexAggregate: gammaExposure,
    pcrAggregate,
  };
}
