import { NextRequest, NextResponse } from 'next/server';
import { manuallyCollectData } from '@/lib/services/dataCollector';
import { ALL_MARKET_INDEXES, CORE_MARKET_INDEXES, SECTOR_INDEXES } from '@/lib/config/market-indexes';
import { createContextLogger } from '@/lib/utils/logger';

const logger = createContextLogger('CollectMarketIndexesAPI');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type = 'core', batchSize = 2 } = body; // 'core', 'sector', or 'all'
    
    let indexesToCollect: string[] = [];
    
    switch (type) {
      case 'core':
        indexesToCollect = CORE_MARKET_INDEXES;
        break;
      case 'sector':
        indexesToCollect = SECTOR_INDEXES;
        break;
      case 'all':
        indexesToCollect = ALL_MARKET_INDEXES;
        break;
      default:
        indexesToCollect = CORE_MARKET_INDEXES;
    }
    
    logger.debug(`Starting market index data collection for ${indexesToCollect.length} indexes (${type})`);
    logger.debug(`Processing in batches of ${batchSize} with delays to respect rate limits`);
    
    const results = [];
    const errors = [];
    
    // Process indexes in batches
    for (let i = 0; i < indexesToCollect.length; i += batchSize) {
      const batch = indexesToCollect.slice(i, i + batchSize);
      logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.join(', ')}`);
      
      // Process each symbol in the current batch
      for (const symbol of batch) {
        try {
          logger.debug(`Collecting data for index ${symbol}...`);
          await manuallyCollectData(symbol);
          results.push({
            symbol,
            status: 'success',
            timestamp: new Date().toISOString()
          });
          
          // Add delay between requests within a batch (3 seconds)
          if (batch.indexOf(symbol) < batch.length - 1) {
            logger.debug('Waiting 3 seconds before next request...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (error) {
          logger.error(`Failed to collect data for ${symbol}:`, { symbol }, error instanceof Error ? error : new Error(String(error)));
          errors.push({
            symbol,
            status: 'error',
            message: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Add longer delay between batches (15 seconds) to ensure we don't hit rate limits
      if (i + batchSize < indexesToCollect.length) {
        logger.debug('Waiting 15 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Market index collection completed`,
      type,
      total: indexesToCollect.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in collect-market-indexes API:', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        error: true, 
        message: error instanceof Error ? error.message : 'Failed to collect market index data'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to show usage
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger market index data collection',
    usage: {
      method: 'POST',
      body: {
        type: 'core' // Options: 'core', 'sector', 'all'
      }
    },
    indexes: {
      core: CORE_MARKET_INDEXES,
      sector: SECTOR_INDEXES,
      all: ALL_MARKET_INDEXES
    }
  });
}