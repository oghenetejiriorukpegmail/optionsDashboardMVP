import { NextResponse } from 'next/server';
import { getStockData, getTechnicalIndicators, getMarketSentiment } from '@/lib/db/repository';

// GET /api/historical-data?ticker=TSLA&type=price&days=30 - Get historical data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const type = searchParams.get('type'); // 'price', 'technical', 'sentiment'
    const daysStr = searchParams.get('days');
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }
    
    if (!type || !['price', 'technical', 'sentiment'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid type parameter is required (price, technical, or sentiment)' },
        { status: 400 }
      );
    }
    
    const days = daysStr ? parseInt(daysStr, 10) : 30;
    
    let data;
    switch (type) {
      case 'price':
        data = await getStockData(ticker, days);
        break;
      case 'technical':
        data = await getTechnicalIndicators(ticker, days);
        break;
      case 'sentiment':
        data = await getMarketSentiment(ticker, days);
        break;
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
