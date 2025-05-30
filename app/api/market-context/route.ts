import { NextResponse } from 'next/server';
import { 
  getLatestStockData,
  getLatestTechnicalIndicators,
  getStockData
} from '@/lib/db/repository';
import { CORE_MARKET_INDEXES, MARKET_THRESHOLDS } from '@/lib/config/market-indexes';

interface MarketIndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  trend: string;
  rsi?: number;
  distanceFrom20MA?: number;
}

interface MarketContext {
  timestamp: string;
  marketSentiment: string;
  volatility: {
    vix: number;
    level: string;
  };
  indexes: MarketIndexData[];
  breadth: {
    advancing: number;
    declining: number;
    neutral: number;
    advanceDeclineRatio: number;
  };
  summary: string;
}

// GET /api/market-context - Get overall market context from indexes
export async function GET(request: Request) {
  try {
    const indexes: MarketIndexData[] = [];
    let vixData: MarketIndexData | null = null;
    
    // Fetch data for all core market indexes
    for (const symbol of CORE_MARKET_INDEXES) {
      try {
        const stockData = await getLatestStockData(symbol);
        const technicalData = await getLatestTechnicalIndicators(symbol);
        
        if (!stockData) {
          console.log(`No data found for index ${symbol}`);
          continue;
        }
        
        // Calculate daily change
        const change = stockData.close - stockData.open;
        const changePercent = (change / stockData.open) * 100;
        
        // Determine trend based on price relative to moving averages
        let trend = 'Neutral';
        let distanceFrom20MA = 0;
        
        if (technicalData && technicalData.ema_20) {
          distanceFrom20MA = ((stockData.close - technicalData.ema_20) / technicalData.ema_20) * 100;
          
          if (distanceFrom20MA > MARKET_THRESHOLDS.STRONG_UPTREND) {
            trend = 'Strong Uptrend';
          } else if (distanceFrom20MA > MARKET_THRESHOLDS.UPTREND) {
            trend = 'Uptrend';
          } else if (distanceFrom20MA < MARKET_THRESHOLDS.STRONG_DOWNTREND) {
            trend = 'Strong Downtrend';
          } else if (distanceFrom20MA < MARKET_THRESHOLDS.DOWNTREND) {
            trend = 'Downtrend';
          }
        }
        
        const indexData: MarketIndexData = {
          symbol,
          name: symbol, // Will be enhanced with proper names
          price: stockData.close,
          change,
          changePercent,
          volume: stockData.volume,
          trend,
          rsi: technicalData?.rsi_14,
          distanceFrom20MA
        };
        
        if (symbol === 'VIX') {
          vixData = indexData;
        } else {
          indexes.push(indexData);
        }
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
      }
    }
    
    // Calculate market breadth
    const advancing = indexes.filter(idx => idx.changePercent > 0.1).length;
    const declining = indexes.filter(idx => idx.changePercent < -0.1).length;
    const neutral = indexes.length - advancing - declining;
    const advanceDeclineRatio = declining > 0 ? advancing / declining : advancing;
    
    // Determine overall market sentiment
    let marketSentiment = 'Neutral';
    const avgChange = indexes.reduce((sum, idx) => sum + idx.changePercent, 0) / indexes.length;
    
    if (avgChange > 1) {
      marketSentiment = 'Bullish';
    } else if (avgChange < -1) {
      marketSentiment = 'Bearish';
    } else if (avgChange > 0.3) {
      marketSentiment = 'Slightly Bullish';
    } else if (avgChange < -0.3) {
      marketSentiment = 'Slightly Bearish';
    }
    
    // Determine volatility level
    let volatilityLevel = 'Normal';
    const vixValue = vixData?.price || 20;
    
    if (vixValue < MARKET_THRESHOLDS.VIX_LOW) {
      volatilityLevel = 'Low';
    } else if (vixValue > MARKET_THRESHOLDS.VIX_EXTREME) {
      volatilityLevel = 'Extreme';
    } else if (vixValue > MARKET_THRESHOLDS.VIX_HIGH) {
      volatilityLevel = 'High';
    }
    
    // Generate market summary
    const summary = generateMarketSummary(marketSentiment, volatilityLevel, avgChange, advanceDeclineRatio);
    
    const marketContext: MarketContext = {
      timestamp: new Date().toISOString(),
      marketSentiment,
      volatility: {
        vix: vixValue,
        level: volatilityLevel
      },
      indexes,
      breadth: {
        advancing,
        declining,
        neutral,
        advanceDeclineRatio
      },
      summary
    };
    
    return NextResponse.json(marketContext);
  } catch (error) {
    console.error('Error fetching market context:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch market context',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function generateMarketSummary(sentiment: string, volatility: string, avgChange: number, adRatio: number): string {
  const changeDirection = avgChange > 0 ? 'up' : 'down';
  const changeAmount = Math.abs(avgChange).toFixed(2);
  
  let summary = `Markets are ${sentiment.toLowerCase()} with major indexes ${changeDirection} ${changeAmount}% on average. `;
  
  if (volatility === 'Low') {
    summary += 'Volatility remains low, suggesting calm market conditions. ';
  } else if (volatility === 'High' || volatility === 'Extreme') {
    summary += `Volatility is ${volatility.toLowerCase()}, indicating increased market uncertainty. `;
  }
  
  if (adRatio > 2) {
    summary += 'Market breadth is positive with advancing indexes outnumbering declining ones.';
  } else if (adRatio < 0.5) {
    summary += 'Market breadth is negative with more declining indexes than advancing.';
  } else {
    summary += 'Market breadth is mixed.';
  }
  
  return summary;
}