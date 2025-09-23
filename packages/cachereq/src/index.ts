// 缓存req 入口
import LRUCache from '@smileznpm/mylru';

/**
 * 基于 LRUCache 实现的带缓存的 request 方法
 * @param reqFn 原始请求方法 (返回 Promise)
 * @param options LRU 缓存配置（可选）
 * @returns 包装后的请求方法，自动缓存结果
 */
function createCacheRequest<T = any, Args extends any[] = any[]>(
    reqFn: (...args: Args) => Promise<T>,
    options?: {
        cacheKey?: (...args: Args) => string; // 自定义缓存 key 生成函数
        lruOptions?: {
            maxCacheNum?: number;
            maxCacheTime?: number;
        };
    }
) {
    const cache = LRUCache.getInstance(options?.lruOptions);

    // 默认缓存 key: reqFn.toString + JSON.stringify(args)
    function getCacheKey(args: Args): string {
        if (options?.cacheKey) {
            return options.cacheKey(...args);
        }
        // 注意：reqFn.toString 可能会很长，实际项目可自定义
        return (
            'cachereq:' +
            (reqFn.name || 'anon') +
            ':' +
            JSON.stringify(args)
        );
    }

    return async (...args: Args): Promise<T> => {
        const key = getCacheKey(args);
        const cached = await cache.get(key);
        if (cached !== null && cached !== undefined) {
            return cached as T;
        }
        const result = await reqFn(...args);
        await cache.set(key, result);
        return result;
    };
}

export { createCacheRequest };
