/**
 * Simple In-Memory Cache
 * No Redis required!
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  // Set cache with optional expiration (in seconds)
  set(key, value, expireSeconds = 3600) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store value
    this.cache.set(key, {
      value,
      createdAt: Date.now()
    });

    // Set expiration timer
    if (expireSeconds > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, expireSeconds * 1000);
      
      this.timers.set(key, timer);
    }

    return true;
  }

  // Get cached value
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    return item.value;
  }

  // Delete from cache
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  // Check if key exists
  has(key) {
    return this.cache.has(key);
  }

  // Clear all cache
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Get all keys
  keys() {
    return Array.from(this.cache.keys());
  }
}

// Create singleton instance
const memoryCache = new MemoryCache();

// Export functions matching Redis interface
const connectRedis = async () => {
  console.log('✅ Using in-memory cache (no Redis required)');
  return memoryCache;
};

const getRedisClient = () => memoryCache;

const setCache = async (key, value, expireSeconds = 3600) => {
  try {
    memoryCache.set(key, value, expireSeconds);
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

const getCache = async (key) => {
  try {
    return memoryCache.get(key);
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    return memoryCache.delete(key);
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  memoryCache
};