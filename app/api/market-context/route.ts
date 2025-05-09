import { NextResponse } from 'next/server';
import { getLatestMarketContext } from '@/lib/db/repository';

// GET /api/market-context?ticker=TSLA - Get market context for a ticker
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }
    
    const marketContext = await getLatestMarketContext(ticker);
    return NextResponse.json(marketContext);
  } catch (error) {
    console.error('Error fetching market context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market context' },
      { status: 500 }
    );
  }
}
