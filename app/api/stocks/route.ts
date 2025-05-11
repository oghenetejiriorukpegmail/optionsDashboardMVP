import { NextResponse } from 'next/server';
import { fetchMultipleStockAnalyses } from '@/lib/data/yahooFinanceAPI';

// Cache for stocks data to avoid excessive API calls
let cachedStocks: any[] = [];
let cacheTimestamp: Date | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET() {
  try {
    // Check if we need to refresh the cache
    const now = new Date();
    const needRefresh = cachedStocks.length === 0 || 
                        !cacheTimestamp || 
                        (now.getTime() - cacheTimestamp.getTime() > CACHE_DURATION);
    
    if (needRefresh) {
      console.log('Fetching fresh stocks data from Yahoo Finance...');
      
      // List of most popular stocks (subset of NASDAQ 100)
      // Starting with just a few to avoid rate limiting
      const symbols = ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA'];
      
      // Fetch data for all symbols
      const stocksData = await fetchMultipleStockAnalyses(symbols);
      
      // Transform into simplified format for the stocks API
      cachedStocks = stocksData.map(stock => ({
        symbol: stock.symbol,
        price: stock.price,
        setupType: stock.setupType,
        emaTrend: stock.emaTrend,
        pcr: stock.pcr,
        rsi: stock.rsi,
        strength: stock.setupStrength.charAt(0).toUpperCase() + stock.setupStrength.slice(1),
        volume: stock.volume.current,
        iv: 30, // Default since we don't have real IV data
        gex: 0, // Default since we don't have real GEX data
        vwiv: 29, // Default estimate
      }));
      
      cacheTimestamp = now;
    }
    
    return NextResponse.json(cachedStocks);
  } catch (error) {
    console.error('Error in stocks API:', error);
    
    // Return an error response
    return NextResponse.json({ 
      error: true, 
      message: 'Failed to fetch real-time stock data' 
    }, { status: 503 }); // Service Unavailable
  }
}