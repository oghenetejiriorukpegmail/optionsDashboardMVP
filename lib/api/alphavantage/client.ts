import axios from 'axios';
import { alphaVantageRateLimiter, globalRateLimiter } from '@/lib/utils/rateLimiter';

// API key should be stored in environment variables in production
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

// API configuration
const BASE_URL = 'https://www.alphavantage.co/query';

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const cache: Record<string, { timestamp: number; data: any }> = {};

/**
 * Call Alpha Vantage API with rate limiting
 */
export async function callAlphaVantageApi(params: any) {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key not configured');
  }

  // Check cache first
  const cacheKey = JSON.stringify(params);
  const cached = cache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Alpha Vantage returning cached data for:', params.function);
    return cached.data;
  }

  // Apply rate limiting
  await alphaVantageRateLimiter.waitIfNeeded();
  await globalRateLimiter.waitIfNeeded();

  try {
    console.log('Alpha Vantage API request:', params.function, params.symbol);
    
    const response = await axios.get(BASE_URL, {
      params: {
        ...params,
        apikey: API_KEY
      }
    });
    
    // Check for error messages in the Alpha Vantage response
    if (response.data && typeof response.data === 'object' && response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }
    
    if (response.data && typeof response.data === 'object' && response.data['Note']) {
      console.warn('Alpha Vantage API Note:', response.data['Note']);
    }
    
    // Cache the successful response
    cache[cacheKey] = {
      timestamp: Date.now(),
      data: response.data
    };
    
    return response.data;
  } catch (error) {
    console.error('Alpha Vantage API request failed:', error);
    throw error;
  }
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache() {
  Object.keys(cache).forEach(key => delete cache[key]);
}