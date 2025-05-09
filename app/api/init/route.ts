import { NextResponse } from 'next/server';
import { initializeDefaultCollection } from '@/lib/services/dataCollector';

// Initialize data collection on app startup
let initialized = false;

// GET /api/init - Initialize data collection
export async function GET() {
  try {
    // Only initialize once
    if (!initialized) {
      initializeDefaultCollection();
      initialized = true;
      return NextResponse.json({ message: 'Data collection initialized' });
    }
    
    return NextResponse.json({ message: 'Data collection already initialized' });
  } catch (error) {
    console.error('Error initializing data collection:', error);
    return NextResponse.json(
      { error: 'Failed to initialize data collection' },
      { status: 500 }
    );
  }
}
