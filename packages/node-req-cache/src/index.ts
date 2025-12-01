
/**
 * LRU Cache Item Interface
 */
interface CacheItem<V> {
  value: V;
  freshUntil: number; // 新鲜有效期截止时间 (ms)
  expireAt: number;   // 彻底过期时间 (ms) - 此时间后数据会被删除
}

/**
 * LRU Cache Interface
 * 定义缓存实现的通用接口
 */
interface ILRUCache<V> {
  get(key: string): V | undefined | Promise<V | undefined>;
  getStale(key: string): V | undefined | Promise<V | undefined>;
  set(key: string, value: V, ttl: number, staleTtl?: number): void | Promise<void>;
  delete(key: string): void | Promise<void>;
  clear?(): void;
}

/**
 * Memory LRU Cache Implementation (L1)
 * 
 * 基于 Map 和双向链表思想（利用 Map 的 key 插入顺序特性）实现的同步内存缓存。
 * 适合作为第一层高速缓存。
 */
class MemoryLRUCache<V> implements ILRUCache<V> {
  // 使用 Map 存储，Key 顺序即为 LRU 顺序
  private cache = new Map<string, CacheItem<V>>();

  /**
   * @param limit 缓存最大容量
   */
  constructor(private limit: number) {}

  /**
   * 获取缓存值 (Fresh)
   * 
   * 1. 如果不存在或彻底过期，返回 undefined。
   * 2. 如果存在但不再新鲜 (stale)，返回 undefined (视为 miss，但在内存中保留以备 fallback)。
   * 3. 如果存在且新鲜，刷新 LRU 位置并返回 value。
   */
  get(key: string): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    const now = Date.now();

    // 检查是否彻底过期 (Hard Expire)
    if (now > item.expireAt) {
      this.cache.delete(key);
      return undefined;
    }

    // 检查是否新鲜 (Freshness)
    if (now > item.freshUntil) {
      // 数据 stale，主流程视为 miss，不刷新位置 (或者可以选择刷新，策略取决于是否想保留 stale 数据更久)
      // 这里选择不刷新，让其自然淘汰，除非触发了 getStale
      return undefined;
    }

    // 刷新 LRU 位置：先删除再重新 set，使其移到 Map 的末尾（表示最近使用）
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  /**
   * 获取 Stale 值 (Fallback)
   * 仅在请求失败需要兜底时调用。
   */
  getStale(key: string): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // 如果已经彻底过期，则不能作为 stale 数据使用
    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Fallback 被命中也算一次访问，刷新 LRU
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  /**
   * 设置缓存值
   * @param ttl Freshness TTL (ms)
   * @param staleTtl Stale TTL (ms) - 额外允许保留的时间
   */
  set(key: string, value: V, ttl: number, staleTtl: number = 0): void {
    // 如果键已存在，先删除以更新位置
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.limit) {
      // 如果超出容量，淘汰最久未使用的项 (Map 的第一个元素)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) { 
        this.cache.delete(firstKey);
      }
    }

    const now = Date.now();
    this.cache.set(key, { 
      value, 
      freshUntil: now + ttl,
      expireAt: now + ttl + staleTtl 
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Async LRU Cache Simulation (L2)
 * 
 * L2 缓存实现的模拟（例如 Redis、IndexedDB 等）。
 * 在实际生产中，应替换为真实的异步存储客户端。
 */
class AsyncLRUCache<V> implements ILRUCache<V> {
  private cache = new Map<string, CacheItem<V>>();
  
  constructor(private limit: number) {}

  private async simulateDelay(): Promise<void> {
    // 模拟 5ms 网络延迟
    return new Promise(resolve => setTimeout(resolve, 5));
  }

  async get(key: string): Promise<V | undefined> {
    await this.simulateDelay();
    
    const item = this.cache.get(key);
    if (!item) return undefined;

    const now = Date.now();
    if (now > item.expireAt) {
      this.cache.delete(key);
      return undefined;
    }

    if (now > item.freshUntil) {
      return undefined;
    }

    // 刷新 LRU
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  async getStale(key: string): Promise<V | undefined> {
    await this.simulateDelay();
    
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return undefined;
    }

    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  async set(key: string, value: V, ttl: number, staleTtl: number = 0): Promise<void> {
    await this.simulateDelay();

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.limit) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
         this.cache.delete(firstKey);
      }
    }
    
    const now = Date.now();
    this.cache.set(key, { 
      value, 
      freshUntil: now + ttl,
      expireAt: now + ttl + staleTtl
    });
  }
  
  async delete(key: string): Promise<void> {
    await this.simulateDelay();
    this.cache.delete(key);
  }
}

export interface NodeReqCacheOptions {
  /**
   * 自定义缓存 Key 生成器
   * 默认使用 `JSON.stringify(args)`，注意对象属性顺序可能影响 Key。
   */
  keyGenerator?: (...args: any[]) => string;
  
  /** L1 (内存) 缓存最大数量，默认 100 */
  l1CacheSize?: number;
  
  /** L2 (异步) 缓存最大数量，默认 1000 */
  l2CacheSize?: number;
  
  /** 
   * 缓存新鲜时间 (TTL, ms)
   * 超过此时间后被视为 Stale，需重新获取。默认 60000ms (1分钟)。
   */
  ttl?: number; 
  
  /**
   * 额外陈旧保留时间 (Stale TTL, ms)
   * 在 TTL 过期后，但在 `ttl + staleTtl` 之前，如果请求失败，允许返回此旧数据兜底。
   * 默认 0 (不启用兜底)。
   */
  staleTtl?: number;
  
  /**
   * 命中缓存时是否后台刷新 (Stale-While-Revalidate 变体)
   * 如果为 true，即使命中 Fresh 缓存，也会在后台触发一次更新。
   * 默认 false。
   */
  revalidateOnHit?: boolean;
  
  /**
   * 请求失败重试次数
   * 默认 0 (不重试)。
   */
  retry?: number;
}

/**
 * Node Request Cache (Higher-Order Function)
 * 
 * 为异步函数添加两级缓存（L1 内存 + L2 异步）、请求合并（Deduplication）及 Stale Fallback 能力。
 * 
 * @param fn 需要被缓存的异步函数
 * @param options 配置选项
 * @returns 包装后的具备缓存能力的函数
 */
export function nodeReqCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: NodeReqCacheOptions = {}
): T {
  const {
    keyGenerator = (...args) => JSON.stringify(args),
    l1CacheSize = 100,
    l2CacheSize = 1000,
    ttl = 60000,
    staleTtl = 0,
    revalidateOnHit = false,
    retry = 0
  } = options;

  // 初始化缓存实例
  // 使用 Awaited<ReturnType<T>> 提取 Promise 解析后的值类型
  type ReturnValue = Awaited<ReturnType<T>>;
  const l1Cache = new MemoryLRUCache<ReturnValue>(l1CacheSize);
  const l2Cache = new AsyncLRUCache<ReturnValue>(l2CacheSize);
  
  // 请求合并 Map：记录正在进行中的请求 Promise
  // 防止并发请求造成缓存穿透 (Cache Stampede)
  const ongoingRequests = new Map<string, Promise<ReturnValue>>();

  // 返回包装后的函数，保持原函数签名
  return (async (...args: Parameters<T>): Promise<ReturnValue> => {
    const key = keyGenerator(...args);

    /**
     * 执行原始请求并更新缓存
     * 包含重试机制
     */
    const fetchAndUpdate = async (): Promise<ReturnValue> => {
      let lastError: unknown;
      let result: ReturnValue | undefined;
      
      const maxAttempts = 1 + (retry >= 0 ? retry : 0);
      
      for (let i = 0; i < maxAttempts; i++) {
        try {
          // 执行原函数
          result = await fn(...args);
          lastError = undefined;
          break; 
        } catch (e) {
          lastError = e;
          // 循环继续，直到达到最大尝试次数
        }
      }
      
      if (lastError !== undefined) {
        throw lastError;
      }

      // 成功获取数据，更新两级缓存
      // 注意：即便是 undefined 也是有效值 (取决于 fn 的返回类型)
      // TypeScript 中 result 此时已赋值，但 strictNullChecks 下可能需注意，这里假定 result 是合法的 ReturnValue
      l1Cache.set(key, result as ReturnValue, ttl, staleTtl);
      
      // L2 更新不阻塞主流程，但需等待写入完成以保证一致性? 
      // 通常为了速度可以不 await，但这里为了逻辑简单选择 await，或者 catch 错误
      await l2Cache.set(key, result as ReturnValue, ttl, staleTtl).catch(err => {
        console.error(`[node-req-cache] L2 set failed for key: ${key}`, err);
      });

      return result as ReturnValue;
    };

    /**
     * 触发后台验证 (Fire-and-Forget)
     */
    const triggerRevalidation = () => {
       if (ongoingRequests.has(key)) return;
       
       const promise = fetchAndUpdate()
         .catch(err => {
           // 后台更新失败仅记录日志
           console.error(`[node-req-cache] Background revalidation failed for key: ${key}`, err);
         })
         .finally(() => {
           ongoingRequests.delete(key);
         });
       
       // 使用 any 规避类型不匹配 (Promise<void> vs Promise<ReturnValue>)，因为我们只存 Promise 对象用于占位
       ongoingRequests.set(key, promise as any);
    };

    // 1. 检查 L1 缓存 (同步，最快)
    const l1Result = l1Cache.get(key);
    if (l1Result !== undefined) {
      if (revalidateOnHit) {
        triggerRevalidation();
      }
      return l1Result;
    }

    // 2. 检查请求合并 (Deduplication)
    // 如果有相同的请求正在进行，直接等待其结果
    const ongoing = ongoingRequests.get(key);
    if (ongoing) {
      return ongoing;
    }

    // 3. 发起新请求 (L2 检查 -> Fetch)
    // 使用 IIFE 创建一个新的 Promise 流程
    const promiseRef: { current: Promise<ReturnValue> | null } = { current: null };

    const promise = (async (): Promise<ReturnValue> => {
      try {
        // 3a. 双重检查 L1 (防止在 await 期间有其他请求写入了 L1)
        const doubleCheckL1 = l1Cache.get(key);
        if (doubleCheckL1 !== undefined) {
           if (revalidateOnHit) triggerRevalidation();
           return doubleCheckL1;
        }

        // 3b. 检查 L2 缓存 (异步)
        const l2Result = await l2Cache.get(key);
        if (l2Result !== undefined) {
          // L2 命中 -> 回填 L1
          l1Cache.set(key, l2Result, ttl, staleTtl);
          if (revalidateOnHit) triggerRevalidation();
          return l2Result;
        }

        // 3c. 缓存未命中，执行回源请求
        return await fetchAndUpdate();

      } catch (error) {
        // 4. 错误处理与 Stale Fallback
        if (staleTtl > 0) {
          // 尝试获取过期的 L1 数据
          const staleL1 = l1Cache.getStale(key);
          if (staleL1 !== undefined) return staleL1;

          // 尝试获取过期的 L2 数据
          const staleL2 = await l2Cache.getStale(key);
          if (staleL2 !== undefined) return staleL2;
        }
        
        // 无法恢复，抛出异常
        throw error;
      } finally {
        // 清理请求合并记录
        // 仅当当前 promise 仍是 ongoingRequests 中的那个时才删除
        // (避免删除掉了由 triggerRevalidation 可能产生的新 promise - 虽然逻辑上很难重叠)
        if (promiseRef.current && ongoingRequests.get(key) === promiseRef.current) {
          ongoingRequests.delete(key);
        }
      }
    })();

    promiseRef.current = promise;
    ongoingRequests.set(key, promise);

    return promise;
  }) as T;
}

export default nodeReqCache;
