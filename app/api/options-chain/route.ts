import { NextResponse } from 'next/server';
import axios from 'axios';

// Cache for options chain data
const optionsCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const expiration = searchParams.get('expiration');
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }
    
    // Create a cache key based on symbol and expiration
    const cacheKey = `${symbol}_${expiration || 'default'}`;
    
    // Check if we have valid cached data
    const now = Date.now();
    if (optionsCache[cacheKey] && now - optionsCache[cacheKey].timestamp < CACHE_DURATION) {
      return NextResponse.json(optionsCache[cacheKey].data);
    }
    
    // Determine if we should fetch expirations list or specific chain
    if (!expiration) {
      // If no expiration provided, return all available expirations
      const expirations = await fetchOptionExpirations(symbol);
      
      const response = {
        symbol,
        expirations,
        timestamp: new Date().toISOString()
      };
      
      // Cache the response
      optionsCache[cacheKey] = {
        data: response,
        timestamp: now
      };
      
      return NextResponse.json(response);
    } else {
      // If expiration provided, return options chain for that date
      const optionsChain = await fetchOptionsChain(symbol, expiration);
      
      const response = {
        symbol,
        expiration,
        strikes: optionsChain,
        timestamp: new Date().toISOString()
      };
      
      // Cache the response
      optionsCache[cacheKey] = {
        data: response,
        timestamp: now
      };
      
      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Error fetching options chain:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'Failed to fetch options chain',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Mock function to fetch option expirations (simulated for demo)
async function fetchOptionExpirations(symbol: string): Promise<string[]> {
  // In a real implementation, this would call a proper options data API
  
  // Generate a series of future expiration dates (3rd Friday of upcoming months)
  const expirations: string[] = [];
  const now = new Date();
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() + i);
    date.setDate(1); // Set to first day of month
    
    // Find the third Friday
    const dayOfWeek = date.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    date.setDate(date.getDate() + daysUntilFriday + 14); // First Friday + 14 days = third Friday
    
    expirations.push(date.toISOString().split('T')[0]);
  }
  
  return expirations;
}

// Mock function to fetch options chain for a specific expiration (simulated for demo)
async function fetchOptionsChain(symbol: string, expiration: string): Promise<any[]> {
  // In a real implementation, this would call a proper options data API
  
  // Generate a series of strikes around the current price
  try {
    // Try to get the current price from a basic API
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
    const price = response.data.chart.result[0].meta.regularMarketPrice;
    
    // Generate strikes around the current price
    const strikes = [];
    const strikeCount = 15; // Number of strikes above and below the current price
    const strikeStep = Math.max(1, Math.round(price * 0.025) / 5) * 5; // Round to nearest $5
    
    for (let i = -strikeCount; i <= strikeCount; i++) {
      const strike = Math.round((price + i * strikeStep) * 2) / 2; // Round to nearest $0.5
      
      if (strike <= 0) continue;
      
      // Generate IV based on strike distance from current price
      // Further OTM options typically have higher IV (volatility smile)
      const strikeDist = Math.abs(strike - price) / price;
      const baseIV = 0.3 + strikeDist * 0.5; // Base IV of 30% plus smile effect
      
      // Higher gamma near the current price
      const gamma = strikeDist < 0.05 ? 0.08 - strikeDist : 0.03 - strikeDist;
      
      // Vanna is higher when IV is changing rapidly (slope of volatility smile)
      const vanna = strikeDist > 0.02 && strikeDist < 0.1 ? 0.05 - strikeDist * 0.3 : 0.01;
      
      // Charm is time decay of delta, higher for ATM options
      const charm = strikeDist < 0.03 ? 0.04 - strikeDist : 0.01;
      
      // Vomma is sensitivity of vega to IV changes, higher for OTM options
      const vomma = strikeDist > 0.1 ? 0.15 : 0.05 + strikeDist * 0.5;
      
      // Generate synthetic OI and volume data based on strike
      const strikeProximityFactor = 1 - Math.min(1, strikeDist * 10);
      const baseOI = 1000 + Math.random() * 9000;
      
      strikes.push({
        strike,
        callOpenInterest: Math.round(baseOI * (strike > price ? 1.5 : 0.8) * strikeProximityFactor),
        putOpenInterest: Math.round(baseOI * (strike < price ? 1.5 : 0.8) * strikeProximityFactor),
        callVolume: Math.round((baseOI * 0.1) * (strike > price ? 1.3 : 0.7) * strikeProximityFactor),
        putVolume: Math.round((baseOI * 0.1) * (strike < price ? 1.3 : 0.7) * strikeProximityFactor),
        callIV: baseIV + (strike > price ? 0.05 : 0),
        putIV: baseIV + (strike < price ? 0.05 : 0),
        gamma: Math.max(0, gamma),
        vanna: vanna,
        charm: charm,
        vomma: vomma
      });
    }
    
    return strikes;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    
    // Fallback to a default price and generate strikes around it
    const defaultPrice = 100;
    
    // Generate strikes around the default price
    const strikes = [];
    const strikeCount = 15;
    const strikeStep = 5;
    
    for (let i = -strikeCount; i <= strikeCount; i++) {
      const strike = defaultPrice + i * strikeStep;
      
      if (strike <= 0) continue;
      
      strikes.push({
        strike,
        callOpenInterest: Math.round(1000 + Math.random() * 9000),
        putOpenInterest: Math.round(1000 + Math.random() * 9000),
        callVolume: Math.round(100 + Math.random() * 900),
        putVolume: Math.round(100 + Math.random() * 900),
        gamma: Math.max(0, 0.04 - Math.abs(strike - defaultPrice) / defaultPrice * 0.1),
        vanna: 0.02,
        charm: 0.01,
        vomma: 0.05
      });
    }
    
    return strikes;
  }
}