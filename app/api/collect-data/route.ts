import { NextRequest, NextResponse } from 'next/server';
import { manuallyCollectData } from '@/lib/services/dataCollector';
import { manuallyCollectData as enhancedCollectData } from '@/lib/services/enhancedDataCollector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, enhanced = false } = body;
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Manually collecting data for ${ticker} (enhanced: ${enhanced})`);
    
    // Use enhanced collector if specified, otherwise use regular
    if (enhanced) {
      await enhancedCollectData(ticker);
    } else {
      await manuallyCollectData(ticker);
    }
    
    return NextResponse.json({
      success: true,
      message: `Data collection triggered for ${ticker}`,
      ticker,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in collect-data API:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: error instanceof Error ? error.message : 'Failed to collect data'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check collection status
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger data collection',
    usage: {
      method: 'POST',
      body: {
        ticker: 'AAPL',
        enhanced: false
      }
    }
  });
}