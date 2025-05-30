import axios, { AxiosInstance } from 'axios';
import { SCANNER_CONFIG } from '@/lib/config';

// Cache for cookie and crumb
let authCache: {
  cookie: string;
  crumb: string;
  timestamp: number;
} | null = null;

// Auth cache TTL - 1 hour
const AUTH_CACHE_TTL = 60 * 60 * 1000;

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  }
});

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get Yahoo Finance authentication (cookie and crumb)
 */
export async function getYahooFinanceAuth(): Promise<{ cookie: string; crumb: string }> {
  // Check cache first
  if (authCache && Date.now() - authCache.timestamp < AUTH_CACHE_TTL) {
    return { cookie: authCache.cookie, crumb: authCache.crumb };
  }

  let attempts = 0;
  const maxAttempts = SCANNER_CONFIG.API.RETRY_ATTEMPTS;

  while (attempts < maxAttempts) {
    try {
      // Step 1: Get cookie from Yahoo Finance
      const cookieResponse = await axiosInstance.get('https://finance.yahoo.com', {
        withCredentials: true,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      // Extract cookies from response
      const setCookieHeader = cookieResponse.headers['set-cookie'];
      if (!setCookieHeader) {
        throw new Error('No cookies received from Yahoo Finance');
      }

      // Parse cookies
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const cookieString = cookies
        .map(cookie => cookie.split(';')[0])
        .join('; ');

      // Step 2: Get crumb using the cookie
      const crumbResponse = await axiosInstance.get('https://query1.finance.yahoo.com/v1/test/getcrumb', {
        headers: {
          'Cookie': cookieString,
          'Referer': 'https://finance.yahoo.com',
        },
      });

      const crumb = crumbResponse.data;
      if (!crumb) {
        throw new Error('No crumb received from Yahoo Finance');
      }

      // Cache the auth
      authCache = {
        cookie: cookieString,
        crumb: crumb,
        timestamp: Date.now(),
      };

      console.log('Successfully obtained Yahoo Finance authentication');
      return { cookie: cookieString, crumb: crumb };
    } catch (error: any) {
      attempts++;
      console.error(`Error getting Yahoo Finance auth (attempt ${attempts}/${maxAttempts}):`, error.message);

      if (attempts < maxAttempts) {
        const backoffTime = Math.min(1000 * Math.pow(2, attempts), 10000);
        console.log(`Backing off for ${backoffTime}ms before retry`);
        await delay(backoffTime);
      }
    }
  }

  throw new Error(`Failed to get Yahoo Finance authentication after ${maxAttempts} attempts`);
}

/**
 * Make authenticated request to Yahoo Finance API
 */
export async function makeAuthenticatedRequest<T>(url: string, params?: any): Promise<T> {
  const auth = await getYahooFinanceAuth();
  
  let attempts = 0;
  const maxAttempts = SCANNER_CONFIG.API.RETRY_ATTEMPTS;
  const retryDelay = SCANNER_CONFIG.API.RETRY_DELAY;

  while (attempts < maxAttempts) {
    try {
      const response = await axiosInstance.get(url, {
        params: {
          ...params,
          crumb: auth.crumb,
        },
        headers: {
          'Cookie': auth.cookie,
          'Referer': 'https://finance.yahoo.com',
        },
      });

      return response.data;
    } catch (error: any) {
      attempts++;
      const status = error.response?.status;
      
      console.error(`Error fetching from Yahoo Finance API (attempt ${attempts}/${maxAttempts}):`, 
        status ? `Status ${status}` : error.message);

      // If we get 401, invalidate auth cache and retry
      if (status === 401) {
        console.log('Got 401, invalidating auth cache');
        authCache = null;
        // Get new auth on next attempt
      }

      if (attempts < maxAttempts) {
        const backoffTime = status === 429 
          ? Math.min(retryDelay * Math.pow(2, attempts), 30000)
          : retryDelay;
        
        console.log(`Backing off for ${backoffTime}ms before retry`);
        await delay(backoffTime);
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts`);
}

/**
 * Clear authentication cache
 */
export function clearAuthCache(): void {
  authCache = null;
  console.log('Yahoo Finance auth cache cleared');
}