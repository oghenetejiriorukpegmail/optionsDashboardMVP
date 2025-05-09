import { NextResponse } from 'next/server';
import { initializeDefaultCollection } from '@/lib/services/dataCollector';
import { initDb } from '@/lib/db';

// Singleton flag to track initialization
let isInitialized = false;

// GET /api/health - Health check and initialization
export async function GET() {
  // Initialize data collection on first request
  if (!isInitialized) {
    try {
      // First initialize the database
      await initDb();
      
      // Then start data collection
      await initializeDefaultCollection();
      
      isInitialized = true;
      console.log('Data collection initialized during health check');
    } catch (error) {
      console.error('Failed to initialize data collection:', error);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Failed to initialize data collection',
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
