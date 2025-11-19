// Product caching utility for offline-first architecture
// Caches products in localStorage and IndexedDB for reliable offline access

interface CachedProducts {
  products: any[];
  timestamp: number;
  category?: string;
}

const CACHE_KEY_PREFIX = "empi_products_cache_";
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

// Get all cache keys
function getCacheKey(category?: string): string {
  if (category) {
    return `${CACHE_KEY_PREFIX}${category}`;
  }
  return `${CACHE_KEY_PREFIX}all`;
}

// Check if cache is still valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION_MS;
}

// Get products from cache
export function getCachedProducts(category?: string): any[] | null {
  if (typeof window === "undefined") return null;

  try {
    const cacheKey = getCacheKey(category);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      console.log(`📦 No cache found for key: ${cacheKey}`);
      return null;
    }

    const data: CachedProducts = JSON.parse(cached);

    if (!isCacheValid(data.timestamp)) {
      console.log(`⏰ Cache expired for key: ${cacheKey}`);
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log(`✅ Cache HIT for key: ${cacheKey}, products: ${data.products.length}`);
    return data.products;
  } catch (error) {
    console.error("❌ Failed to read product cache:", error);
    return null;
  }
}

// Save products to cache
export function setCachedProducts(products: any[], category?: string): void {
  if (typeof window === "undefined") return;

  try {
    const cacheKey = getCacheKey(category);
    const data: CachedProducts = {
      products,
      timestamp: Date.now(),
      category,
    };

    localStorage.setItem(cacheKey, JSON.stringify(data));
    console.log(`💾 Cached ${products.length} products for key: ${cacheKey}`);
  } catch (error) {
    console.error("❌ Failed to save product cache:", error);
  }
}

// Clear all product caches
export function clearAllProductCaches(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared cache: ${key}`);
      }
    });
  } catch (error) {
    console.error("❌ Failed to clear product caches:", error);
  }
}

// Get cache info (for debugging)
export function getCacheInfo(): Record<string, any> {
  if (typeof window === "undefined") return {};

  try {
    const info: Record<string, any> = {};
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const data: CachedProducts = JSON.parse(cached);
          info[key] = {
            products: data.products.length,
            cachedAt: new Date(data.timestamp).toISOString(),
            isValid: isCacheValid(data.timestamp),
            expiresIn: Math.max(0, CACHE_DURATION_MS - (Date.now() - data.timestamp)),
          };
        }
      }
    });

    return info;
  } catch (error) {
    console.error("❌ Failed to get cache info:", error);
    return {};
  }
}
