import { NextResponse } from 'next/server';
import { 
  getWatchlist, 
  addToWatchlist, 
  removeFromWatchlist, 
  WatchlistItem 
} from '@/lib/db/watchlist';
import { getLatestStockPrice } from '@/lib/db/repository';

export async function GET() {
  try {
    // Get watchlist items from database
    const watchlist = await getWatchlist();
    
    // Update prices from latest stock data
    const updatedWatchlist = await Promise.all(
      watchlist.map(async (item) => {
        // Get latest price from database
        const latestPrice = await getLatestStockPrice(item.symbol);
        
        // If price is found, update it
        if (latestPrice) {
          return {
            ...item,
            price: latestPrice.close
          };
        }
        
        return item;
      })
    );
    
    return NextResponse.json(updatedWatchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate minimum required fields
    if (!data.symbol || !data.setupType || !data.price || !data.entryTarget) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Add to watchlist
    const result = await addToWatchlist({
      symbol: data.symbol,
      setupType: data.setupType,
      price: data.price,
      entryTarget: data.entryTarget,
      stopLoss: data.stopLoss || 'N/A',
      targetPrice: data.targetPrice || data.price * 1.05, // Default to 5% higher if not provided
      notes: data.notes || ''
    });
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        id: result.id
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in watchlist POST:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json(
      { success: false, message: 'Symbol parameter is required' },
      { status: 400 }
    );
  }
  
  const result = await removeFromWatchlist(symbol);
  
  if (result.success) {
    return NextResponse.json({
      success: true,
      message: result.message
    });
  } else {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 404 }
    );
  }
}
