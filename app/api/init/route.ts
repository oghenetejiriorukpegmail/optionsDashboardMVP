import { NextResponse } from 'next/server';
import { 
  initializeDataCollection, 
  initializeDefaultCollection,
  getCollectionStatus,
  manuallyCollectData
} from '@/lib/services/enhancedDataCollector';

// Initialize data collection on app startup
let initialized = false;

/**
 * GET /api/init - Initialize data collection for default tickers or a specific ticker
 * Query parameters:
 * - ticker (optional): Specific ticker to initialize
 * - force (optional): Force refresh data for ticker
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const force = searchParams.get('force') === 'true';
    
    if (ticker) {
      // Initialize for a specific ticker
      initializeDataCollection(ticker);
      
      // Force immediate collection if requested
      if (force) {
        await manuallyCollectData(ticker);
      }
      
      return NextResponse.json({ 
        message: `Data collection initialized for ${ticker}`, 
        ticker,
        force,
        timestamp: new Date().toISOString() 
      });
    } else {
      // Only initialize default collection once
      if (!initialized) {
        initializeDefaultCollection();
        initialized = true;
        
        return NextResponse.json({ 
          message: 'Data collection initialized for default tickers', 
          timestamp: new Date().toISOString(),
          status: getCollectionStatus()
        });
      }
      
      return NextResponse.json({ 
        message: 'Data collection already initialized', 
        timestamp: new Date().toISOString(),
        status: getCollectionStatus()
      });
    }
  } catch (error) {
    console.error('Error initializing data collection:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize data collection', 
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}