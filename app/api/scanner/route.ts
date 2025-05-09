import { NextResponse } from 'next/server';
import { 
  getAllTickers, 
  getLatestMarketContext, 
  getOptionsData, 
  getDailySummaries,
  saveTradeSetup
} from '@/lib/db/repository';
import { analyzeTradeSetups, batchAnalyzeSetups } from '@/lib/services/strategyAnalyzer';

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
      
      if (refresh) {
        // Force a new analysis
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
      const marketContext = await getLatestMarketContext(symbol);
      
      const result = {
        symbol: setup.ticker,
        setupType: setup.setup_type,
        emaTrend: getEmaTrend(marketContext?.technicals),
        pcr: marketContext?.sentiment?.pcr || 0,
        rsi: marketContext?.technicals?.rsi_14 || 0,
        setupStrength: getSetupStrength(setup.strength),
        price: marketContext?.price?.close || 0,
        entryPrice: setup.entry_price,
        stopLoss: setup.stop_loss,
        targetPrice: setup.target_price,
        riskRewardRatio: setup.risk_reward_ratio,
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
      
      results.push({
        symbol: ticker,
        setupType: setup.setup_type,
        emaTrend: getEmaTrend(marketContext?.technicals),
        pcr: marketContext?.sentiment?.pcr || 0,
        rsi: marketContext?.technicals?.rsi_14 || 0,
        setupStrength: getSetupStrength(setup.strength),
        price: marketContext?.price?.close || 0,
        entryPrice: setup.entry_price,
        stopLoss: setup.stop_loss,
        targetPrice: setup.target_price,
        riskRewardRatio: setup.risk_reward_ratio,
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
    console.error('Error in scanner API:', error);
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

// Helper function to fetch trade setups from database
async function getTradeSetups(ticker: string) {
  // Import directly to avoid circular dependency
  const { getTradeSetups } = require('@/lib/db/repository');
  
  try {
    return await getTradeSetups(ticker);
  } catch (error) {
    console.error(`Error getting trade setups for ${ticker}:`, error);
    return [];
  }
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
