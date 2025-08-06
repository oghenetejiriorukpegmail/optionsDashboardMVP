import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { createContextLogger } from '@/lib/utils/logger';

const logger = createContextLogger('WatchlistDB');

export interface WatchlistItem {
  id?: number;
  symbol: string;
  setupType: string;
  price: number;
  entryTarget: string;
  stopLoss: string;
  targetPrice: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

async function getDatabase(): Promise<Database> {
  const dbPath = path.join(process.cwd(), 'data', 'options.db');
  return await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  try {
    const db = await getDatabase();
    
    // Create watchlist table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        setupType TEXT NOT NULL,
        price REAL NOT NULL,
        entryTarget TEXT NOT NULL,
        stopLoss TEXT,
        targetPrice REAL,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const rows = await db.all('SELECT * FROM watchlist ORDER BY createdAt DESC') as WatchlistItem[];
    
    await db.close();
    return rows;
  } catch (error) {
    logger.error('Error fetching watchlist:', {}, error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

export async function addToWatchlist(item: WatchlistItem): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    const db = await getDatabase();
    
    // Create table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        setupType TEXT NOT NULL,
        price REAL NOT NULL,
        entryTarget TEXT NOT NULL,
        stopLoss TEXT,
        targetPrice REAL,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if symbol already exists
    const existing = await db.get('SELECT id FROM watchlist WHERE symbol = ?', item.symbol);
    
    if (existing) {
      // Update existing entry
      await db.run(`
        UPDATE watchlist 
        SET setupType = ?, price = ?, entryTarget = ?, stopLoss = ?, targetPrice = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE symbol = ?
      `, [
        item.setupType,
        item.price,
        item.entryTarget,
        item.stopLoss || 'N/A',
        item.targetPrice || item.price * 1.05,
        item.notes || '',
        item.symbol
      ]);
      
      await db.close();
      return { success: true, message: `Updated ${item.symbol} in watchlist` };
    } else {
      // Insert new entry
      const result = await db.run(`
        INSERT INTO watchlist (symbol, setupType, price, entryTarget, stopLoss, targetPrice, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        item.symbol,
        item.setupType,
        item.price,
        item.entryTarget,
        item.stopLoss || 'N/A',
        item.targetPrice || item.price * 1.05,
        item.notes || ''
      ]);
      
      await db.close();
      return { success: true, message: `Added ${item.symbol} to watchlist`, id: result.lastID };
    }
  } catch (error) {
    logger.error('Error adding to watchlist:', {}, error instanceof Error ? error : new Error(String(error)));
    return { success: false, message: 'Failed to add to watchlist' };
  }
}

export async function removeFromWatchlist(symbol: string): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDatabase();
    
    const result = await db.run('DELETE FROM watchlist WHERE symbol = ?', symbol);
    
    await db.close();
    
    if (result.changes && result.changes > 0) {
      return { success: true, message: `Removed ${symbol} from watchlist` };
    } else {
      return { success: false, message: `${symbol} not found in watchlist` };
    }
  } catch (error) {
    logger.error('Error removing from watchlist:', {}, error instanceof Error ? error : new Error(String(error)));
    return { success: false, message: 'Failed to remove from watchlist' };
  }
}