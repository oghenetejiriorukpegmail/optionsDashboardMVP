import { SCANNER_CONFIG } from '@/lib/config';

// Cache types 
type CacheEntry<T> = {
  value: T;
  timestamp: number;
  expiresAt: number;
};

type CacheOptions = {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Use stale data while fetching new data
  staleTtl?: number; // How long stale data can be used after expiration
  checkFreshness?: (data: any) => boolean; // Custom function to check if data is still fresh
};

/**
 * Memory cache manager for API responses
 */
class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private fetchPromises: Map<string, Promise<any>> = new Map();
  private readonly defaultTtl: number = SCANNER_CONFIG.CACHE_DURATION;
  private readonly defaultOptions: CacheOptions = {
    ttl: SCANNER_CONFIG.CACHE_DURATION,
    staleWhileRevalidate: true,
    staleTtl: SCANNER_CONFIG.CACHE_DURATION * 3, // 3x the normal TTL for stale data
  };

  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    
    // If the entry is expired, delete it
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  /**
   * Get an item from the cache, allowing stale data if enabled
   * @param key Cache key
   * @param options Cache options
   * @returns The cached value (possibly stale) or undefined if not found or too stale
   */
  getWithStale<T>(key: string, options?: CacheOptions): { 
    value: T | undefined; 
    isStale: boolean; 
  } {
    const opts = { ...this.defaultOptions, ...options };
    const entry = this.cache.get(key);
    
    if (!entry) {
      return { value: undefined, isStale: false };
    }

    const now = Date.now();
    
    // If the entry is expired but within stale TTL and staleWhileRevalidate is enabled
    if (now > entry.expiresAt) {
      const maxStaleTime = entry.expiresAt + (opts.staleTtl || 0);
      
      if (opts.staleWhileRevalidate && now <= maxStaleTime) {
        return { value: entry.value, isStale: true };
      }
      
      this.cache.delete(key);
      return { value: undefined, isStale: false };
    }
    
    return { value: entry.value, isStale: false };
  }

  /**
   * Set an item in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const opts = { ...this.defaultOptions, ...options };
    const ttl = opts.ttl || this.defaultTtl;
    const now = Date.now();
    
    this.cache.set(key, {
      value,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Check if an item exists in the cache and is not expired
   * @param key Cache key
   * @returns True if the item exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    return Date.now() <= entry.expiresAt;
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Refresh an item in the cache by extending its TTL
   * @param key Cache key
   * @param options Cache options
   * @returns True if the item was refreshed
   */
  refresh(key: string, options?: CacheOptions): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    const opts = { ...this.defaultOptions, ...options };
    const ttl = opts.ttl || this.defaultTtl;
    const now = Date.now();
    
    entry.expiresAt = now + ttl;
    this.cache.set(key, entry);
    
    return true;
  }

  /**
   * Fetch data with caching
   * @param key Cache key
   * @param fetchFn Function to fetch data if not in cache
   * @param options Cache options
   * @returns The data from cache or fetched
   */
  async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Try to get from cache first
    const { value, isStale } = this.getWithStale<T>(key, opts);
    
    // If we have a non-stale value, return it
    if (value !== undefined && !isStale) {
      return value;
    }
    
    // If we're already fetching this key, wait for that promise
    if (this.fetchPromises.has(key)) {
      try {
        return await this.fetchPromises.get(key) as T;
      } catch (error) {
        // If the promise fails but we have stale data, return it
        if (value !== undefined) {
          return value;
        }
        throw error;
      }
    }
    
    // Create a new fetch promise
    const fetchPromise = (async () => {
      try {
        // If we have stale data, return it while we fetch
        if (isStale && opts.staleWhileRevalidate) {
          // Fetch in the background
          this.backgroundFetch(key, fetchFn, opts);
          return value as T;
        }
        
        // No cache hit or stale data, fetch new data
        const data = await fetchFn();
        this.set(key, data, opts);
        return data;
      } finally {
        // Clean up the fetch promise
        this.fetchPromises.delete(key);
      }
    })();
    
    // Store the promise for deduplication
    this.fetchPromises.set(key, fetchPromise);
    
    return fetchPromise;
  }

  /**
   * Perform a background fetch to update cached data
   */
  private async backgroundFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const data = await fetchFn();
      this.set(key, data, options);
    } catch (error) {
      console.error(`Background fetch failed for key ${key}:`, error);
      // Don't throw - this is a background refresh
    }
  }

  /**
   * Cleanup expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Create a shared instance
export const cacheManager = new CacheManager();

// Export a wrapped version of fetch that uses the cache
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  return cacheManager.fetchWithCache(key, fetchFn, options);
}

// Set up periodic cache cleanup
setInterval(() => {
  cacheManager.cleanup();
}, 60000); // Cleanup every minute

export default cacheManager;