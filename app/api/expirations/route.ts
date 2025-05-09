import { NextResponse } from 'next/server';
import { getExpirationDates } from '@/lib/db/repository';

// GET /api/expirations?ticker=TSLA - Get available expiration dates for a ticker
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
    
    const expirationDates = await getExpirationDates(ticker);
    return NextResponse.json({ expirationDates });
  } catch (error) {
    console.error('Error fetching expiration dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expiration dates' },
      { status: 500 }
    );
  }
}
