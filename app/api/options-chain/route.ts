import { NextResponse } from 'next/server';
import dataProviderFactory from '@/lib/data-providers';
import { ibkrClient, initializeIBKR } from '@/lib/services/ibkrClient';
import { createContextLogger } from '@/lib/utils/logger';

const logger = createContextLogger('Options Chain API');

// Cache for options chain data
const optionsCache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const expiration = searchParams.get('expiration');
    
    logger.debug('Options chain request received', { symbol, expiration });
    
    if (!symbol) {
      logger.warn('Options chain request missing symbol parameter');
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }
    
    // Create a cache key based on symbol and expiration
    const cacheKey = `${symbol}_${expiration || 'default'}`;
    
    // Check if we have valid cached data
    const now = Date.now();
    if (optionsCache[cacheKey] && now - optionsCache[cacheKey].timestamp < CACHE_DURATION) {
      logger.debug('Returning cached options data', { symbol, expiration, cacheKey });
      return NextResponse.json(optionsCache[cacheKey].data);
    }
    
    // Determine if we should fetch expirations list or specific chain
    if (!expiration) {
      // If no expiration provided, return all available expirations
      logger.debug('Fetching option expirations', { symbol });
      const result = await fetchOptionExpirations(symbol);
      
      const response = {
        symbol,
        expirations: result.expirations,
        timestamp: new Date().toISOString(),
        dataSource: result.dataSource || 'none'
      };
      
      // Cache the response
      optionsCache[cacheKey] = {
        data: response,
        timestamp: now
      };
      
      return NextResponse.json(response);
    } else {
      // If expiration provided, return options chain for that date
      logger.debug('Fetching options chain', { symbol, expiration });
      const optionsChain = await fetchOptionsChain(symbol, expiration);
      
      if (!optionsChain) {
        return NextResponse.json({ 
          error: true, 
          message: 'Failed to fetch options chain',
          details: 'No data available for the specified symbol and expiration'
        }, { status: 404 });
      }
      
      const response = {
        symbol,
        expiration,
        strikes: optionsChain.strikes,
        calls: optionsChain.calls,
        puts: optionsChain.puts,
        timestamp: new Date().toISOString(),
        dataSource: optionsChain.dataSource,
        dataLatency: optionsChain.latency
      };
      
      // Cache the response
      optionsCache[cacheKey] = {
        data: response,
        timestamp: now
      };
      
      return NextResponse.json(response);
    }
  } catch (error) {
    logger.error('Error in options chain API', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ 
      error: true, 
      message: 'Failed to fetch options chain',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Fetch available option expirations using data provider
async function fetchOptionExpirations(symbol: string): Promise<{ expirations: string[], dataSource?: string }> {
  try {
    // Try IBKR first if available
    if (process.env.IBKR_GATEWAY_URL) {
      try {
        const initialized = await initializeIBKR();
        if (initialized) {
          const expirations = await ibkrClient.getOptionsChain(symbol).then(chain => 
            chain ? chain.expirations : null
          );
          if (expirations && expirations.length > 0) {
            // Got option expirations from IBKR
            return { expirations, dataSource: 'IBKR' };
          }
        }
      } catch (error) {
        logger.debug('IBKR option expirations failed, falling back', { symbol, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    // Use data provider factory
    const expirations = await dataProviderFactory.getAvailableExpirations(symbol);
    if (expirations) {
      return { expirations, dataSource: 'Yahoo Finance' };
    }
    
    // If no data available from any provider, return empty array
    return { expirations: [], dataSource: 'none' };
  } catch (error) {
    logger.error('Error fetching option expirations', { symbol }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Fetch options chain for a specific expiration using data provider
async function fetchOptionsChain(symbol: string, expiration: string): Promise<unknown> {
  try {
    // Try IBKR first if available
    if (process.env.IBKR_GATEWAY_URL) {
      try {
        const initialized = await initializeIBKR();
        if (initialized) {
          const optionsChain = await ibkrClient.getOptionsChain(symbol);
          if (optionsChain && optionsChain.strikes.length > 0) {
            // Transform IBKR strikes into calls and puts arrays
            const calls = optionsChain.strikes.map(strike => strike.call).filter(Boolean);
            const puts = optionsChain.strikes.map(strike => strike.put).filter(Boolean);
            
            return {
              strikes: optionsChain.strikes,
              calls,
              puts,
              dataSource: 'IBKR',
              latency: 0
            };
          }
        }
      } catch (error) {
        logger.debug('IBKR options chain failed, falling back', { symbol, expiration, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    // Use data provider factory
    const optionsChain = await dataProviderFactory.getOptionsChain(symbol, expiration);
    if (optionsChain) {
      return optionsChain;
    }
    
    return null;
  } catch (error) {
    logger.error('Error fetching options chain', { symbol, expiration }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}