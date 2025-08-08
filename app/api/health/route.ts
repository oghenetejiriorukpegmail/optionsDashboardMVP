import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { createContextLogger } from '@/lib/utils/logger';

const logger = createContextLogger('Health API');

// Singleton flag to track initialization
let isInitialized = false;

// GET /api/health - Health check and initialization
export async function GET() {
  // Initialize database only (no auto data collection)
  if (!isInitialized) {
    try {
      // Initialize the database only
      await initDb();
      
      // DON'T start automatic data collection to save API calls
      // await initializeDefaultCollection();
      
      isInitialized = true;
      logger.debug('Database initialized during health check (auto-collection disabled)');
    } catch (error) {
      logger.error('Failed to initialize database:', {}, error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Failed to initialize database',
          error: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  }
  
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    initialized: isInitialized
  });
}
