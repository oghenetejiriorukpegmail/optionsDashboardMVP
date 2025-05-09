import { 
  getLatestMarketContext, 
  getOptionsData,
  saveTradeSetup
} from '../db/repository';

interface TradeSetup {
  ticker: string;
  date: string;
  timestamp: number;
  setup_type: string;
  strength: number;
  entry_price: number;
  stop_loss: number;
  target_price: number;
  risk_reward_ratio: number;
}

interface MarketContext {
  price: {
    ticker: string;
    date: string;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  technicals: {
    ticker: string;
    date: string;
    timestamp: number;
    ema_10: number;
    ema_20: number;
    ema_50: number;
    rsi_14: number;
    stoch_rsi: number;
  };
  sentiment: {
    ticker: string;
    date: string;
    timestamp: number;
    pcr: number;
    iv_percentile: number;
    max_pain: number;
    gamma_exposure: number;
  };
}

// Main function to analyze a ticker and identify trade setups based on the PRD criteria
export async function analyzeTradeSetups(ticker: string): Promise<TradeSetup | null> {
  try {
    console.log(`Analyzing trade setups for ${ticker}`);
    
    // Get latest market context
    const context = await getLatestMarketContext(ticker);
    if (!context.price || !context.technicals || !context.sentiment) {
      console.error(`Incomplete market context for ${ticker}`);
      return null;
    }
    
    // Get options data (needed for key levels)
    const optionsData = await getOptionsData(ticker);
    if (!optionsData || optionsData.length === 0) {
      console.error(`No options data available for ${ticker}`);
      return null;
    }
    
    // Analyze for bullish setup - higher priority
    const bullishSetup = await analyzeBullishSetup(context, optionsData);
    if (bullishSetup) {
      await saveTradeSetup(bullishSetup);
      return bullishSetup;
    }
    
    // Analyze for bearish setup - second priority
    const bearishSetup = await analyzeBearishSetup(context, optionsData);
    if (bearishSetup) {
      await saveTradeSetup(bearishSetup);
      return bearishSetup;
    }
    
    // Analyze for neutral setup - lowest priority
    const neutralSetup = await analyzeNeutralSetup(context, optionsData);
    if (neutralSetup) {
      await saveTradeSetup(neutralSetup);
      return neutralSetup;
    }
    
    console.log(`No trade setups identified for ${ticker}`);
    return null;
  } catch (error) {
    console.error(`Error analyzing trade setups for ${ticker}:`, error);
    return null;
  }
}

// Analyze bullish setup based on PRD criteria
async function analyzeBullishSetup(context: MarketContext, optionsData: any[]): Promise<TradeSetup | null> {
  const { price, technicals, sentiment } = context;
  
  // Check for bullish trend using EMAs
  const isBullishTrend = technicals.ema_10 > technicals.ema_20 && technicals.ema_20 > technicals.ema_50;
  
  // Check for bullish sentiment using PCR with IV-adjusted thresholds from PRD
  const isBullishPcr = sentiment.iv_percentile > 80 
    ? sentiment.pcr < 0.5  // High IV threshold
    : sentiment.iv_percentile > 50
      ? sentiment.pcr < 0.8  // Moderate IV threshold
      : sentiment.pcr < 0.7;  // Low IV threshold
  
  // Check for bullish momentum using RSI range from PRD
  const isBullishRsi = technicals.rsi_14 >= 55 && technicals.rsi_14 <= 80;
  const isBullishStochRsi = technicals.stoch_rsi > 60;
  
  // Check for positive GEX (bullish stability) from PRD
  const isBullishGex = sentiment.gamma_exposure > 500000000;
  
  // Is price near support? (Using EMA10 as support level from PRD)
  const isPriceNearSupport = Math.abs(price.close - technicals.ema_10) / technicals.ema_10 < 0.02;
  
  // Check for high call OI above current price (key level confirmation)
  const highCallOiAbove = optionsData.some(option => 
    option.strike_price > price.close && 
    option.call_oi > 1000 && 
    option.call_gamma > 0.05
  );
  
  // Calculate overall bullish strength
  let bullishStrength = 0;
  if (isBullishTrend) bullishStrength += 30;
  if (isBullishPcr) bullishStrength += 20;
  if (isBullishRsi) bullishStrength += 15;
  if (isBullishStochRsi) bullishStrength += 15;
  if (isBullishGex) bullishStrength += 10;
  if (isPriceNearSupport) bullishStrength += 5;
  if (highCallOiAbove) bullishStrength += 5;
  
  // If overall strength is strong enough, create a bullish setup
  if (bullishStrength >= 70) {
    // Find next resistance level from options chain (high call OI or gamma)
    const nextResistance = optionsData
      .filter(option => option.strike_price > price.close)
      .sort((a, b) => a.strike_price - b.strike_price)
      .find(option => option.call_oi > 1000 || option.call_gamma > 0.05);
    
    const targetPrice = nextResistance ? nextResistance.strike_price : price.close * 1.05;
    const stopLoss = technicals.ema_20 * 0.99; // Stop below EMA 20 (5% cushion)
    const riskRewardRatio = (targetPrice - price.close) / (price.close - stopLoss);
    
    return {
      ticker: price.ticker,
      date: price.date,
      timestamp: price.timestamp,
      setup_type: 'bullish',
      strength: bullishStrength,
      entry_price: price.close,
      stop_loss: stopLoss,
      target_price: targetPrice,
      risk_reward_ratio: riskRewardRatio,
    };
  }
  
  return null;
}

// Analyze bearish setup based on PRD criteria
async function analyzeBearishSetup(context: MarketContext, optionsData: any[]): Promise<TradeSetup | null> {
  const { price, technicals, sentiment } = context;
  
  // Check for bearish trend using EMAs
  const isBearishTrend = technicals.ema_10 < technicals.ema_20 && technicals.ema_20 < technicals.ema_50;
  
  // Check for bearish sentiment using PCR with IV-adjusted thresholds from PRD
  const isBearishPcr = sentiment.iv_percentile > 80 
    ? sentiment.pcr > 1.5  // High IV threshold
    : sentiment.iv_percentile > 50
      ? sentiment.pcr > 1.2  // Moderate IV threshold
      : sentiment.pcr > 1.3;  // Low IV threshold
  
  // Check for bearish momentum using RSI range from PRD
  const isBearishRsi = technicals.rsi_14 >= 20 && technicals.rsi_14 <= 45;
  const isBearishStochRsi = technicals.stoch_rsi < 40;
  
  // Check for negative GEX (bearish pressure) from PRD
  const isBearishGex = sentiment.gamma_exposure < -500000000;
  
  // Is price near resistance? (Using EMA10 as resistance level from PRD)
  const isPriceNearResistance = Math.abs(price.close - technicals.ema_10) / technicals.ema_10 < 0.02;
  
  // Check for high put OI below current price (key level confirmation)
  const highPutOiBelow = optionsData.some(option => 
    option.strike_price < price.close && 
    option.put_oi > 1000 && 
    option.put_gamma > 0.05
  );
  
  // Calculate overall bearish strength
  let bearishStrength = 0;
  if (isBearishTrend) bearishStrength += 30;
  if (isBearishPcr) bearishStrength += 20;
  if (isBearishRsi) bearishStrength += 15;
  if (isBearishStochRsi) bearishStrength += 15;
  if (isBearishGex) bearishStrength += 10;
  if (isPriceNearResistance) bearishStrength += 5;
  if (highPutOiBelow) bearishStrength += 5;
  
  // If overall strength is strong enough, create a bearish setup
  if (bearishStrength >= 70) {
    // Find next support level from options chain (high put OI or gamma)
    const nextSupport = optionsData
      .filter(option => option.strike_price < price.close)
      .sort((a, b) => b.strike_price - a.strike_price)
      .find(option => option.put_oi > 1000 || option.put_gamma > 0.05);
    
    const targetPrice = nextSupport ? nextSupport.strike_price : price.close * 0.95;
    const stopLoss = technicals.ema_20 * 1.01; // Stop above EMA 20 (1% cushion)
    const riskRewardRatio = (price.close - targetPrice) / (stopLoss - price.close);
    
    return {
      ticker: price.ticker,
      date: price.date,
      timestamp: price.timestamp,
      setup_type: 'bearish',
      strength: bearishStrength,
      entry_price: price.close,
      stop_loss: stopLoss,
      target_price: targetPrice,
      risk_reward_ratio: riskRewardRatio,
    };
  }
  
  return null;
}

// Analyze neutral setup based on PRD criteria
async function analyzeNeutralSetup(context: MarketContext, optionsData: any[]): Promise<TradeSetup | null> {
  const { price, technicals, sentiment } = context;
  
  // Check for neutral trend (flat EMAs within 1% of each other)
  const isNeutralTrend = Math.abs(technicals.ema_10 - technicals.ema_20) / technicals.ema_20 < 0.01 &&
                          Math.abs(technicals.ema_20 - technicals.ema_50) / technicals.ema_50 < 0.01;
  
  // Check for neutral PCR (0.8-1.2) and low IV from PRD
  const isNeutralPcr = sentiment.pcr >= 0.8 && sentiment.pcr <= 1.2;
  const isLowIv = sentiment.iv_percentile < 40;
  
  // Check for neutral RSI range from PRD
  const isNeutralRsi = technicals.rsi_14 >= 45 && technicals.rsi_14 <= 65;
  const isNeutralStochRsi = technicals.stoch_rsi >= 25 && technicals.stoch_rsi <= 75;
  
  // Is price near max pain? (From PRD criteria for neutral setup)
  const isPriceNearMaxPain = Math.abs(price.close - sentiment.max_pain) / sentiment.max_pain < 0.02;
  
  // Check for high gamma (volatility pinning) around current price
  const highGammaAroundPrice = optionsData.some(option => 
    Math.abs(option.strike_price - price.close) / price.close < 0.05 &&
    (option.call_gamma > 0.05 || option.put_gamma > 0.05)
  );
  
  // Check for near-zero GEX (potential breakout)
  const isNearZeroGex = Math.abs(sentiment.gamma_exposure) < 200000000;
  
  // Calculate overall neutral strength
  let neutralStrength = 0;
  if (isNeutralTrend) neutralStrength += 25;
  if (isNeutralPcr) neutralStrength += 20;
  if (isLowIv) neutralStrength += 15;
  if (isNeutralRsi) neutralStrength += 15;
  if (isNeutralStochRsi) neutralStrength += 15;
  if (isPriceNearMaxPain) neutralStrength += 5;
  if (highGammaAroundPrice) neutralStrength += 5;
  
  // If overall strength is strong enough, create a neutral setup
  if (neutralStrength >= 75) {
    // For neutral setups, target is max pain and stop loss is outside expected range
    const expectedMove = price.close * sentiment.iv_percentile * 0.01 * Math.sqrt(7/365);
    const upperBound = price.close + expectedMove;
    const lowerBound = price.close - expectedMove;
    
    const targetPrice = sentiment.max_pain;
    const stopLoss = price.close > targetPrice ? upperBound * 1.02 : lowerBound * 0.98;
    const riskRewardRatio = Math.abs(targetPrice - price.close) / Math.abs(stopLoss - price.close);
    
    return {
      ticker: price.ticker,
      date: price.date,
      timestamp: price.timestamp,
      setup_type: 'neutral',
      strength: neutralStrength,
      entry_price: price.close,
      stop_loss: stopLoss,
      target_price: targetPrice,
      risk_reward_ratio: riskRewardRatio,
    };
  }
  
  return null;
}

// Batch analyze multiple tickers
export async function batchAnalyzeSetups(tickers: string[]): Promise<Record<string, TradeSetup | null>> {
  const results: Record<string, TradeSetup | null> = {};
  
  for (const ticker of tickers) {
    results[ticker] = await analyzeTradeSetups(ticker);
  }
  
  return results;
}
