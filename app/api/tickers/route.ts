import { NextResponse } from 'next/server';
import { getAllTickers } from '@/lib/db/repository';

// GET /api/tickers - Get all tracked tickers
export async function GET() {
  try {
    const tickers = await getAllTickers();
    return NextResponse.json({ tickers });
  } catch (error) {
    console.error('Error fetching tickers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickers' },
      { status: 500 }
    );
  }
}

// POST /api/tickers - Add a new ticker to track
export async function POST(request: Request) {
  try {
    const { ticker } = await request.json();
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      );
    }
    
    // Initialize data collection for the new ticker
    // Note: This needs to be imported dynamically to avoid circular dependencies
    const { initializeDataCollection } = await import('@/lib/services/dataCollector');
    initializeDataCollection(ticker);
    
    return NextResponse.json({ message: `Added ${ticker} to tracking` });
  } catch (error) {
    console.error('Error adding ticker:', error);
    return NextResponse.json(
      { error: 'Failed to add ticker' },
      { status: 500 }
    );
  }
}
