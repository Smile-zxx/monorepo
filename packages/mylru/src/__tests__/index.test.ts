import LRUCache from '../index';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

// Mock indexedDB
const mockIndexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: jest.fn(),
      objectStoreNames: {
        contains: jest.fn(() => false)
      },
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          put: jest.fn(),
          get: jest.fn(),
          clear: jest.fn(),
          delete: jest.fn()
        })),
        oncomplete: null,
        onerror: null
      }))
    }
  }))
};

// 设置全局模拟
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

describe('LRUCache Tests', () => {
  beforeEach(() => {
    // 重置模拟
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // 重置单例
    (LRUCache as any)._instance = null;
  });

  describe('Basic functionality', () => {
    it('should create a new cache instance with default options', () => {
      const cache = new LRUCache();
      expect(cache).toBeInstanceOf(LRUCache);
      expect(cache.size).toBe(0);
      expect(cache.totalBytes).toBe(0);
    });

    it('should create a cache with custom options', () => {
      const cache = new LRUCache({
        maxCacheNum: 5,
        maxCacheTime: 60000 // 1 minute
      });
      expect(cache).toBeInstanceOf(LRUCache);
    });

    it('should implement singleton pattern correctly', () => {
      const cache1 = LRUCache.getInstance();
      const cache2 = LRUCache.getInstance();
      expect(cache1).toBe(cache2);
    });

    it('should allow singleton with options only on first call', () => {
      const cache1 = LRUCache.getInstance({ maxCacheNum: 10 });
      const cache2 = LRUCache.getInstance({ maxCacheNum: 20 });
      expect(cache1).toBe(cache2);
    });
  });

  describe('Set and Get operations', () => {
    let cache: LRUCache;

    beforeEach(() => {
      cache = new LRUCache({ maxCacheNum: 3, maxCacheTime: 60000 });
    });

    it('should set and get values correctly', async () => {
      await cache.set('key1', 'value1');
      const result = await cache.get('key1');
      expect(result).toBe('value1');
      expect(cache.size).toBe(1);
    });

    it('should handle complex objects', async () => {
      const obj = { name: 'test', data: [1, 2, 3] };
      await cache.set('obj', obj);
      const result = await cache.get('obj');
      expect(result).toEqual(obj);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should update existing keys', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key1', 'value2');
      const result = await cache.get('key1');
      expect(result).toBe('value2');
      expect(cache.size).toBe(1);
    });

    it('should track total bytes correctly', async () => {
      await cache.set('key1', 'value1');
      expect(cache.totalBytes).toBeGreaterThan(0);
    });
  });

  describe('LRU eviction', () => {
    let cache: LRUCache;

    beforeEach(() => {
      cache = new LRUCache({ maxCacheNum: 2, maxCacheTime: 60000 });
    });

    it('should evict least recently used item when capacity is exceeded', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3'); // This should evict key1

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBe('value2');
      expect(await cache.get('key3')).toBe('value3');
    });

    it('should update LRU order on get operations', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      // Access key1 to make it recently used
      await cache.get('key1');
      
      // Add new item, should evict key2
      await cache.set('key3', 'value3');

      expect(await cache.get('key1')).toBe('value1');
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBe('value3');
    });
  });

  describe('Expiration', () => {
    let cache: LRUCache;

    beforeEach(() => {
      cache = new LRUCache({ maxCacheNum: 10, maxCacheTime: 100 }); // 100ms expiration
    });

    it('should expire items after maxCacheTime', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(await cache.get('key1')).toBeNull();
    });

    it('should not expire items within maxCacheTime', async () => {
      await cache.set('key1', 'value1');
      
      // Wait less than expiration time
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(await cache.get('key1')).toBe('value1');
    });
  });

  describe('Remove and Clear operations', () => {
    let cache: LRUCache;

    beforeEach(() => {
      cache = new LRUCache({ maxCacheNum: 10, maxCacheTime: 60000 });
    });

    it('should remove specific items', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      await cache.remove('key1');
      
      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBe('value2');
      expect(cache.size).toBe(1);
    });

    it('should clear all items', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      await cache.clear();
      
      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(cache.size).toBe(0);
      expect(cache.totalBytes).toBe(0);
    });

    it('should handle removing non-existent items gracefully', async () => {
      await cache.remove('nonexistent');
      expect(cache.size).toBe(0);
    });
  });

  describe('Storage integration', () => {
    let cache: LRUCache;

    beforeEach(() => {
      cache = new LRUCache({ maxCacheNum: 10, maxCacheTime: 60000 });
    });

    it('should save to localStorage', async () => {
      await cache.set('key1', 'value1');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should load from localStorage on initialization', () => {
      const mockData = JSON.stringify([
        { key: 'key1', value: 'value1', timestamp: Date.now(), size: 100 }
      ]);
      localStorageMock.getItem.mockReturnValue(mockData);
      
      const newCache = new LRUCache();
      // Note: This test depends on the internal implementation
      expect(localStorageMock.getItem).toHaveBeenCalledWith('__mylru_cache__');
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw
      await expect(cache.set('key1', 'value1')).resolves.not.toThrow();
    });
  });

  describe('Edge cases', () => {
    let cache: LRUCache;

    beforeEach(() => {
      cache = new LRUCache({ maxCacheNum: 2, maxCacheTime: 60000 });
    });

    it('should handle empty string keys and values', async () => {
      await cache.set('', '');
      expect(await cache.get('')).toBe('');
    });

    it('should handle very large values', async () => {
      const largeValue = 'x'.repeat(10000);
      await cache.set('large', largeValue);
      expect(await cache.get('large')).toBe(largeValue);
    });

    it('should handle null and undefined values', async () => {
      await cache.set('null', null);
      await cache.set('undefined', undefined);
      
      expect(await cache.get('null')).toBeNull();
      expect(await cache.get('undefined')).toBeUndefined();
    });

    it('should handle zero maxCacheNum', async () => {
      const zeroCache = new LRUCache({ maxCacheNum: 0 });
      await zeroCache.set('key1', 'value1');
      expect(await zeroCache.get('key1')).toBeNull();
    });
  });

  describe('Performance tests', () => {
    let cache: LRUCache;

    beforeEach(() => {
      cache = new LRUCache({ maxCacheNum: 1000, maxCacheTime: 60000 });
    });

    it('should handle many operations efficiently', async () => {
      const start = Date.now();
      
      // Set many items
      for (let i = 0; i < 100; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }
      
      // Get many items
      for (let i = 0; i < 100; i++) {
        await cache.get(`key${i}`);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
