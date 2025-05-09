import { NextResponse } from 'next/server';
import { generateStockAnalysis } from '@/lib/data/yahooFinanceAPI';

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
    
    // Fetch stock analysis from Yahoo Finance
    const stockData = await generateStockAnalysis(symbol);
    
    // Cache the data
    indicatorsCache[symbol] = {
      data: stockData,
      timestamp: now
    };
    
    return NextResponse.json(stockData);
  } catch (error) {
    console.error('Error fetching technical indicators:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'Failed to fetch technical indicators',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}