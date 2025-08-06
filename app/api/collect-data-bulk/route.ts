import { NextRequest, NextResponse } from 'next/server';
import { manuallyCollectData } from '@/lib/services/dataCollector';
import { createContextLogger } from '@/lib/utils/logger';

const logger = createContextLogger('CollectDataBulkAPI');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tickers = ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'] } = body;
    
    logger.debug(`Starting bulk data collection for ${tickers.length} tickers`);
    
    const results = [];
    const errors = [];
    
    // Process tickers sequentially to avoid rate limiting
    for (const ticker of tickers) {
      try {
        logger.debug(`Collecting data for ${ticker}...`);
        await manuallyCollectData(ticker);
        results.push({
          ticker,
          status: 'success',
          timestamp: new Date().toISOString()
        });
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Failed to collect data for ${ticker}:`, { ticker }, error instanceof Error ? error : new Error(String(error)));
        errors.push({
          ticker,
          status: 'error',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Bulk data collection completed`,
      total: tickers.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in bulk collect-data API:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        error: true, 
        message: error instanceof Error ? error.message : 'Failed to collect data'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to show usage
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger bulk data collection',
    usage: {
      method: 'POST',
      body: {
        tickers: ['AAPL', 'MSFT', 'AMZN'] // optional, defaults to common stocks
      }
    },
    defaultTickers: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC']
  });
}