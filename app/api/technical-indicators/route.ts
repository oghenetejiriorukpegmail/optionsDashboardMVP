import { NextResponse } from 'next/server';

// Cache for technical indicator data
const indicatorsCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

    // Get data from ticker-context API which has comprehensive data
    const contextResponse = await fetch(`http://localhost:5002/api/ticker-context?symbol=${symbol}`);
    
    if (!contextResponse.ok) {
      return NextResponse.json({
        error: 'Failed to fetch technical indicators',
        symbol,
        timestamp: new Date().toISOString(),
        details: `Context API returned ${contextResponse.status}`
      }, { status: 500 });
    }
    
    const contextData = await contextResponse.json();
    
    // Extract the latest data point for technical indicators
    const historicalData = contextData.historicalData || [];
    const latestData = historicalData[historicalData.length - 1];
    
    // Build response in expected format
    const response = {
      symbol,
      price: contextData.price || 0,
      setupType: contextData.setupType || 'unknown',
      setupStrength: 'medium',
      emaTrend: contextData.emaTrend || 'Mixed',
      pcr: contextData.pcr || null,
      rsi: latestData?.rsi || contextData.rsi || null,
      stochasticRsi: latestData?.stochasticRsi || null,
      volume: {
        current: latestData?.volume || 0,
        percentChange: null
      },
      iv: contextData.iv || null,
      gex: contextData.gex || null,
      keyLevels: contextData.keyLevels || {
        resistance: [],
        support: [],
        pivot: contextData.price || 0
      },
      recommendation: {
        action: contextData.setupType === 'bullish' ? 'Buy calls' : 
                contextData.setupType === 'bearish' ? 'Buy puts' : 'Hold',
        target: 'Based on key levels',
        stop: 'Based on setup',
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        strike: Math.round(contextData.price || 0)
      },
      indicators: {
        ema10: latestData?.ema10 || null,
        ema20: latestData?.ema20 || null,
        ema50: latestData?.ema50 || null,
        rsi: latestData?.rsi || contextData.rsi || null,
        stochasticRsi: latestData?.stochasticRsi || null
      },
      historicalData: historicalData
    };
    
    // Cache the data
    indicatorsCache[symbol] = {
      data: response,
      timestamp: now
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch technical indicators',
      symbol: new URL(request.url).searchParams.get('symbol'),
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}