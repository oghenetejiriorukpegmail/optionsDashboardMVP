import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { createContextLogger } from '@/lib/utils/logger';

const logger = createContextLogger('InitAPI');

// Database initialization status
let dbInitialized = false;

/**
 * GET /api/init - Initialize database only (no automatic data collection)
 * Data collection must be triggered manually via /api/collect-data
 */
export async function GET() {
  try {
    if (!dbInitialized) {
      // Initialize database
      await initDb();
      dbInitialized = true;
      logger.debug('Database initialized successfully');
      
      return NextResponse.json({ 
        message: 'Database initialized successfully', 
        timestamp: new Date().toISOString(),
        hint: 'Use POST /api/collect-data to manually trigger data collection for specific tickers'
      });
    }
    
    return NextResponse.json({ 
      message: 'Database already initialized', 
      timestamp: new Date().toISOString(),
      hint: 'Use POST /api/collect-data to manually trigger data collection for specific tickers'
    });
  } catch (error) {
    logger.error('Error initializing database:', {}, error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize database', 
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}