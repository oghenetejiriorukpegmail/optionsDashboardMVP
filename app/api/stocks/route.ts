import { NextResponse } from 'next/server';
import { 
  getLatestStockData,
  getLatestTechnicalIndicators,
  getLatestMarketSentiment 
} from '@/lib/db/repository';

export async function GET() {
  try {
    // List of stocks to fetch from database
    const symbols = ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'];
    
    // Fetch data from database for all symbols
    const stocksData = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          // Get latest stock data
          const stockData = await getLatestStockData(symbol);
          if (!stockData) {
            console.log(`No stock data found for ${symbol} in database`);
            return null;
          }
          
          // Get latest technical indicators
          const technicalData = await getLatestTechnicalIndicators(symbol);
          
          // Get latest market sentiment
          const sentimentData = await getLatestMarketSentiment(symbol);
          
          // Determine setup type based on technical indicators
          let setupType = 'Neutral';
          let emaTrend = 'Neutral';
          let strength = 'Medium';
          
          if (technicalData) {
            // Simple logic to determine trend
            if (stockData.close > technicalData.ema_20 && technicalData.ema_20 > technicalData.ema_50) {
              emaTrend = 'Bullish';
              setupType = 'Bullish Momentum';
              strength = 'Strong';
            } else if (stockData.close < technicalData.ema_20 && technicalData.ema_20 < technicalData.ema_50) {
              emaTrend = 'Bearish';
              setupType = 'Bearish Momentum';
              strength = 'Weak';
            }
            
            // Adjust based on RSI
            if (technicalData.rsi_14 > 70) {
              setupType = 'Overbought';
            } else if (technicalData.rsi_14 < 30) {
              setupType = 'Oversold';
            }
          }
          
          return {
            symbol,
            price: stockData.close,
            setupType,
            emaTrend,
            pcr: sentimentData?.pcr || 1.0,
            rsi: technicalData?.rsi_14 || 50,
            strength,
            volume: stockData.volume,
            iv: sentimentData?.iv_percentile || 50,
            gex: sentimentData?.gamma_exposure || 0,
            vwiv: 0, // Not stored in DB yet
            lastUpdated: stockData.timestamp,
            date: stockData.date
          };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null values
    const validStocks = stocksData.filter(stock => stock !== null);
    
    if (validStocks.length === 0) {
      return NextResponse.json({ 
        error: true, 
        message: 'No stock data available in database. Please trigger data collection first.',
        hint: 'POST /api/collect-data with { "ticker": "AAPL" }'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      stocks: validStocks,
      count: validStocks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in stocks API:', error);
    
    return NextResponse.json({ 
      error: true, 
      message: 'Failed to fetch stock data from database',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}