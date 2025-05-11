import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/services/enhancedYahooFinance';
import { getCollectionStatus } from '@/lib/services/enhancedDataCollector';

/**
 * GET /api/status - Returns status information about the data collection and caching
 */
export async function GET(request: Request) {
  try {
    // Get cache stats
    const cacheStats = getCacheStats();
    
    // Get collection status
    const collectionStatus = getCollectionStatus();
    
    // Count active collection jobs
    const activeJobs = Object.keys(collectionStatus).length;
    
    // Get system info
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    };
    
    return NextResponse.json({
      status: 'ok',
      systemInfo,
      dataCollection: {
        activeJobs,
        jobs: collectionStatus,
      },
      cache: {
        size: cacheStats.size,
        entries: cacheStats.entries,
      }
    });
  } catch (error) {
    console.error('Error getting status:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/status/clear-cache - Clears the cache
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'clear-cache') {
      // Import directly to avoid circular dependency
      const { clearCache } = require('@/lib/services/enhancedYahooFinance');
      clearCache();
      
      return NextResponse.json({
        status: 'ok',
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Invalid action',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing status action:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}