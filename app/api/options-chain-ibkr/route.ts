import { NextRequest, NextResponse } from 'next/server';
import { ibkrClient, initializeIBKR } from '@/lib/services/ibkrClient';
import { createContextLogger } from '@/lib/utils/logger';

const logger = createContextLogger('Options Chain IBKR API');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ticker = searchParams.get('ticker');
  const expiration = searchParams.get('expiration');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker parameter is required' }, { status: 400 });
  }

  try {
    // Ensure IBKR is initialized
    const initialized = await initializeIBKR();
    if (!initialized) {
      logger.debug('IBKR not available, falling back to synthetic data');
      // Fall back to synthetic options chain
      return generateSyntheticOptionsChain(ticker);
    }

    // Get real options chain from IBKR
    const optionsChain = await ibkrClient.getOptionsChain(ticker);
    
    if (!optionsChain) {
      logger.debug('No options chain data from IBKR, generating synthetic data');
      return generateSyntheticOptionsChain(ticker);
    }

    // Filter by expiration if provided
    let filteredStrikes = optionsChain.strikes;
    if (expiration && optionsChain.expirations.includes(expiration)) {
      // In a real implementation, we'd filter strikes by expiration
      // For now, return all strikes
    }

    // Format response
    const response = {
      symbol: ticker,
      expirations: optionsChain.expirations,
      strikes: filteredStrikes,
      lastUpdated: new Date().toISOString(),
      dataSource: 'IBKR',
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching IBKR options chain:', {}, error instanceof Error ? error : new Error(String(error)));
    // Fall back to synthetic data on error
    return generateSyntheticOptionsChain(ticker);
  }
}

function generateSyntheticOptionsChain(ticker: string) {
  // Get a base price (in production, this would come from real quotes)
  const basePrice = 100;
  
  // Generate realistic strike prices
  const strikeInterval = basePrice > 100 ? 5 : basePrice > 50 ? 2.5 : 1;
  const numStrikes = 20;
  const strikes = [];
  
  for (let i = -numStrikes/2; i <= numStrikes/2; i++) {
    const strike = Math.round((basePrice + (i * strikeInterval)) * 2) / 2;
    if (strike > 0) {
      // Calculate synthetic Greeks based on moneyness
      const moneyness = (basePrice - strike) / basePrice;
      const timeToExpiry = 30 / 365; // 30 days
      
      // Simplified Black-Scholes approximations
      const iv = 0.25 + Math.abs(moneyness) * 0.1; // IV smile
      const delta = moneyness > 0 ? 0.5 + moneyness * 2 : 0.5 + moneyness * 2;
      const gamma = Math.exp(-moneyness * moneyness * 10) * 0.05;
      const theta = -0.05 * Math.exp(-moneyness * moneyness * 5);
      const vega = gamma * 10;
      
      strikes.push({
        strike,
        call: {
          conid: Math.floor(Math.random() * 1000000),
          bid: Math.max(0, basePrice - strike - 0.10),
          ask: Math.max(0, basePrice - strike + 0.10),
          last: Math.max(0, basePrice - strike),
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          iv: Math.max(0.1, Math.min(1, iv)),
          delta: Math.max(-1, Math.min(1, delta)),
          gamma: Math.max(0, gamma),
          theta,
          vega: Math.max(0, vega),
        },
        put: {
          conid: Math.floor(Math.random() * 1000000),
          bid: Math.max(0, strike - basePrice - 0.10),
          ask: Math.max(0, strike - basePrice + 0.10),
          last: Math.max(0, strike - basePrice),
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          iv: Math.max(0.1, Math.min(1, iv + 0.02)), // Put IV typically slightly higher
          delta: Math.max(-1, Math.min(1, delta - 1)),
          gamma: Math.max(0, gamma),
          theta,
          vega: Math.max(0, vega),
        },
      });
    }
  }
  
  // Generate realistic expiration dates
  const expirations = [];
  const now = new Date();
  
  // Weekly expirations for the next 4 weeks
  for (let i = 1; i <= 4; i++) {
    const expDate = new Date(now);
    expDate.setDate(expDate.getDate() + (i * 7));
    expirations.push(expDate.toISOString().split('T')[0]);
  }
  
  // Monthly expirations for the next 3 months
  for (let i = 1; i <= 3; i++) {
    const expDate = new Date(now);
    expDate.setMonth(expDate.getMonth() + i);
    expDate.setDate(15); // Third Friday approximation
    expirations.push(expDate.toISOString().split('T')[0]);
  }
  
  return NextResponse.json({
    symbol: ticker,
    expirations,
    strikes,
    lastUpdated: new Date().toISOString(),
    dataSource: 'synthetic',
  });
}