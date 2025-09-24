import { createCacheRequest } from '../index';
import LRUCache from '@smileznpm/mylru';

// Mock LRUCache
jest.mock('@smileznpm/mylru');

const mockLRUCache = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  size: 0,
  totalBytes: 0
};

const mockLRUCacheInstance = {
  getInstance: jest.fn(() => mockLRUCache)
};

(LRUCache as any).getInstance = mockLRUCacheInstance.getInstance;

describe('createCacheRequest Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLRUCache.get.mockResolvedValue(null);
    mockLRUCache.set.mockResolvedValue(undefined);
  });

  describe('Basic functionality', () => {
    it('should create a cached request function', () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const cachedRequest = createCacheRequest(mockRequest);
      
      expect(typeof cachedRequest).toBe('function');
    });

    it('should call original request function when cache miss', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      
      const result = await cachedRequest('arg1', 'arg2');
      
      expect(mockRequest).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('response');
    });

    it('should return cached result when cache hit', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue('cached-response');
      
      const result = await cachedRequest('arg1', 'arg2');
      
      expect(mockRequest).not.toHaveBeenCalled();
      expect(result).toBe('cached-response');
    });

    it('should cache the result after first call', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValueOnce(null).mockResolvedValueOnce('cached-response');
      
      await cachedRequest('arg1', 'arg2');
      
      expect(mockLRUCache.set).toHaveBeenCalledWith(
        expect.stringContaining('cachereq:'),
        'response'
      );
    });
  });

  describe('Cache key generation', () => {
    it('should generate cache key based on function name and arguments', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      mockRequest.name = 'testFunction';
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      
      await cachedRequest('arg1', 'arg2');
      
      expect(mockLRUCache.set).toHaveBeenCalledWith(
        'cachereq:testFunction:["arg1","arg2"]',
        'response'
      );
    });

    it('should handle anonymous functions', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      mockRequest.name = '';
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      
      await cachedRequest('arg1');
      
      expect(mockLRUCache.set).toHaveBeenCalledWith(
        'cachereq:anon:["arg1"]',
        'response'
      );
    });

    it('should use custom cache key function when provided', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const customCacheKey = jest.fn().mockReturnValue('custom-key');
      const cachedRequest = createCacheRequest(mockRequest, {
        cacheKey: customCacheKey
      });
      
      mockLRUCache.get.mockResolvedValue(null);
      
      await cachedRequest('arg1', 'arg2');
      
      expect(customCacheKey).toHaveBeenCalledWith('arg1', 'arg2');
      expect(mockLRUCache.set).toHaveBeenCalledWith('custom-key', 'response');
    });

    it('should handle complex arguments in cache key', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      
      const complexArg = { id: 1, name: 'test', data: [1, 2, 3] };
      await cachedRequest(complexArg);
      
      expect(mockLRUCache.set).toHaveBeenCalledWith(
        `cachereq:anon:[${JSON.stringify(complexArg)}]`,
        'response'
      );
    });
  });

  describe('LRU options', () => {
    it('should pass LRU options to cache instance', () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const lruOptions = {
        maxCacheNum: 5,
        maxCacheTime: 60000
      };
      
      createCacheRequest(mockRequest, { lruOptions });
      
      expect(mockLRUCacheInstance.getInstance).toHaveBeenCalledWith(lruOptions);
    });

    it('should work with default LRU options', () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      
      createCacheRequest(mockRequest);
      
      expect(mockLRUCacheInstance.getInstance).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from original request function', async () => {
      const mockRequest = jest.fn().mockRejectedValue(new Error('Request failed'));
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      
      await expect(cachedRequest('arg1')).rejects.toThrow('Request failed');
    });

    it('should handle cache get errors gracefully', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockRejectedValue(new Error('Cache error'));
      
      // Should fallback to calling original function
      const result = await cachedRequest('arg1');
      expect(mockRequest).toHaveBeenCalledWith('arg1');
      expect(result).toBe('response');
    });

    it('should handle cache set errors gracefully', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      mockLRUCache.set.mockRejectedValue(new Error('Cache set error'));
      
      // Should not throw, just not cache the result
      const result = await cachedRequest('arg1');
      expect(result).toBe('response');
    });
  });

  describe('Multiple arguments handling', () => {
    it('should handle requests with no arguments', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      
      const result = await cachedRequest();
      
      expect(mockRequest).toHaveBeenCalledWith();
      expect(result).toBe('response');
    });

    it('should handle requests with multiple arguments', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      
      const result = await cachedRequest('arg1', 123, { key: 'value' }, true);
      
      expect(mockRequest).toHaveBeenCalledWith('arg1', 123, { key: 'value' }, true);
      expect(result).toBe('response');
    });

    it('should differentiate between different argument combinations', async () => {
      const mockRequest = jest.fn()
        .mockResolvedValueOnce('response1')
        .mockResolvedValueOnce('response2');
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      
      const result1 = await cachedRequest('arg1');
      const result2 = await cachedRequest('arg2');
      
      expect(result1).toBe('response1');
      expect(result2).toBe('response2');
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('Real-world scenarios', () => {
    it('should work with API request simulation', async () => {
      const apiRequest = jest.fn().mockImplementation((url: string) => {
        return Promise.resolve({ data: `Response from ${url}`, timestamp: Date.now() });
      });
      
      const cachedApiRequest = createCacheRequest(apiRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      
      const result1 = await cachedApiRequest('/api/users');
      const result2 = await cachedApiRequest('/api/users');
      
      expect(apiRequest).toHaveBeenCalledTimes(1); // Should only be called once due to caching
      expect(result1).toEqual(result2);
    });

    it('should work with database query simulation', async () => {
      const dbQuery = jest.fn().mockImplementation((table: string, id: number) => {
        return Promise.resolve({ id, table, data: `Data for ${table}:${id}` });
      });
      
      const cachedDbQuery = createCacheRequest(dbQuery, {
        cacheKey: (table: string, id: number) => `db:${table}:${id}`
      });
      
      mockLRUCache.get.mockResolvedValue(null);
      
      const result = await cachedDbQuery('users', 123);
      
      expect(dbQuery).toHaveBeenCalledWith('users', 123);
      expect(mockLRUCache.set).toHaveBeenCalledWith('db:users:123', result);
    });
  });

  describe('Performance tests', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const mockRequest = jest.fn().mockResolvedValue('response');
      const cachedRequest = createCacheRequest(mockRequest);
      
      mockLRUCache.get.mockResolvedValue(null);
      
      const promises = Array.from({ length: 10 }, (_, i) => 
        cachedRequest(`arg${i}`)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      expect(mockRequest).toHaveBeenCalledTimes(10);
    });
  });
});
