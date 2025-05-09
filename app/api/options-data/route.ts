import { NextResponse } from 'next/server';
import { getOptionsData, getExpirationDates } from '@/lib/db/repository';

// GET /api/options-data?ticker=TSLA&expiration=2025-05-16 - Get options data for a ticker
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const expiration = searchParams.get('expiration') || undefined;
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }
    
    const optionsData = await getOptionsData(ticker, expiration);
    return NextResponse.json({ optionsData });
  } catch (error) {
    console.error('Error fetching options data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch options data' },
      { status: 500 }
    );
  }
}
