import { getDb } from '../index';

// Type for watchlist items
export interface WatchlistItem {
  id?: number;
  symbol: string;
  setupType: string;
  price: number;
  entryTarget: number;
  stopLoss: number | string;
  targetPrice: number;
  addedOn: string;
  notes?: string;
}

// Get all watchlist items
export async function getWatchlist(): Promise<WatchlistItem[]> {
  const db = await getDb();
  
  try {
    // Create watchlist table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        setupType TEXT NOT NULL,
        price REAL NOT NULL,
        entryTarget REAL NOT NULL,
        stopLoss TEXT NOT NULL,
        targetPrice REAL NOT NULL,
        addedOn TEXT NOT NULL,
        notes TEXT,
        UNIQUE(symbol)
      )
    `);
    
    return await db.all(`SELECT * FROM watchlist ORDER BY addedOn DESC`);
  } catch (error) {
    console.error('Error getting watchlist:', error);
    return [];
  }
}

// Add item to watchlist
export async function addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedOn'>): Promise<{ success: boolean; id?: number; message?: string }> {
  const db = await getDb();
  
  try {
    // Ensure stopLoss is stored as a string
    const stopLoss = typeof item.stopLoss === 'number' 
      ? item.stopLoss.toString() 
      : item.stopLoss;
    
    // Add current timestamp if not provided
    const addedOn = new Date().toISOString();
    
    const result = await db.run(`
      INSERT OR REPLACE INTO watchlist
      (symbol, setupType, price, entryTarget, stopLoss, targetPrice, addedOn, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      item.symbol,
      item.setupType,
      item.price,
      item.entryTarget,
      stopLoss,
      item.targetPrice,
      addedOn,
      item.notes || ''
    ]);
    
    return { 
      success: true, 
      id: result.lastID,
      message: `Added ${item.symbol} to watchlist`
    };
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// Remove item from watchlist
export async function removeFromWatchlist(symbol: string): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  
  try {
    const result = await db.run(`DELETE FROM watchlist WHERE symbol = ?`, [symbol]);
    
    if (result.changes === 0) {
      return { 
        success: false, 
        message: `Symbol ${symbol} not found in watchlist`
      };
    }
    
    return { 
      success: true, 
      message: `Removed ${symbol} from watchlist`
    };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// Get watchlist item by symbol
export async function getWatchlistItem(symbol: string): Promise<WatchlistItem | null> {
  const db = await getDb();
  
  try {
    const item = await db.get(`SELECT * FROM watchlist WHERE symbol = ?`, [symbol]);
    return item || null;
  } catch (error) {
    console.error(`Error getting watchlist item for ${symbol}:`, error);
    return null;
  }
}
