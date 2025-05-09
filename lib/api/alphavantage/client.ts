import axios from 'axios';

// API key should be stored in environment variables in production
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

// API configuration
const BASE_URL = 'https://www.alphavantage.co/query';

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const cache: Record<string, { timestamp: number; data: any }> = {};

// Rate limiting
const API_CALLS_PER_MINUTE = 5;
const REQUEST_QUEUE: Array<{ resolve: Function; reject: Function; params: any }> = [];
let activeRequests = 0;

/**
 * Helper function to process the queue of requests
 */
function processQueue() {
  if (REQUEST_QUEUE.length === 0 || activeRequests >= API_CALLS_PER_MINUTE) return;
  
  const request = REQUEST_QUEUE.shift();
  if (!request) return;
  
  activeRequests++;
  
  setTimeout(() => {
    activeRequests--;
    processQueue();
  }, 60000 / API_CALLS_PER_MINUTE); // Distribute calls evenly throughout the minute
  
  makeRequest(request.params)
    .then(request.resolve)
    .catch(request.reject);
}

/**
 * Actual request function that calls the API
 */
async function makeRequest(params: any) {
  try {
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
    
    return response.data;
  } catch (error) {
    console.error('Alpha Vantage API request failed:', error);
    throw error;
  }
}

/**
 * Main function to call the Alpha Vantage API with caching and rate limiting
 */
export async function callAlphaVantageApi(params: any): Promise<any> {
  // Generate a cache key based on the params
  const cacheKey = JSON.stringify(params);
  
  // Check if we have valid cached data
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    return cache[cacheKey].data;
  }
  
  // Return a new promise that will be resolved when the request is processed
  return new Promise((resolve, reject) => {
    REQUEST_QUEUE.push({
      resolve: (data: any) => {
        // Cache the result
        cache[cacheKey] = {
          timestamp: Date.now(),
          data
        };
        resolve(data);
      },
      reject,
      params
    });
    
    processQueue();
  });
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache() {
  Object.keys(cache).forEach(key => delete cache[key]);
}

/**
 * Get the size of the cache
 */
export function getCacheSize() {
  return Object.keys(cache).length;
}

/**
 * Get the status of the rate limiter
 */
export function getRateLimiterStatus() {
  return {
    activeRequests,
    queuedRequests: REQUEST_QUEUE.length
  };
}

export default {
  callAlphaVantageApi,
  clearCache,
  getCacheSize,
  getRateLimiterStatus
};
