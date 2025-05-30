import { NextResponse } from 'next/server';
import { manuallyCollectData } from '@/lib/services/dataCollector';

/**
 * POST /api/collect-stock - Collects data for a specific stock
 * Query parameters:
 * - symbol: The stock ticker to collect data for
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Starting data collection for ${symbol}`);
    
    // Collect data for the specified stock
    await manuallyCollectData(symbol);
    
    return NextResponse.json({
      success: true,
      message: `Data collection completed for ${symbol}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error collecting stock data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to collect stock data', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}