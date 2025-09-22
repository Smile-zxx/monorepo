// lru缓存 入口
/*
实现一个LRU缓存方法，要求：
1. 最大缓存数量为 输入MaxCacheNum，默认10
2. 缓存过期时间 输入MaxCacheTime，默认10分钟
3. 计算当前缓存的总体积大小，小于3MB的时候，用localstorage，大于3MB的时候，用indexedDB、
*/
type LRUCacheOptions = {
    maxCacheNum?: number;      // 最大缓存数量
    maxCacheTime?: number;     // 单位：毫秒
};

type LRUCacheItem<T = any> = {
    key: string;
    value: T;
    timestamp: number; // 存储时间戳
    size: number;      // 字节大小
};

const DEFAULT_MAX_CACHE_NUM = 10;
const DEFAULT_MAX_CACHE_TIME = 10 * 60 * 1000; // 10分钟
const MAX_LOCALSTORAGE_SIZE = 3 * 1024 * 1024; // 3MB

function getByteSize(str: string): number {
    // 计算字符串的字节大小
    return new Blob([str]).size;
}

function now() {
    return Date.now();
}

class LRUCache<T = any> {
    private maxCacheNum: number;
    private maxCacheTime: number;
    private cacheMap: Map<string, LRUCacheItem<T>>;
    private totalSize: number;
    private storageType: 'localStorage' | 'indexedDB';
    private db: IDBDatabase | null = null;
    private dbName = '__mylru_cache_db__';
    private storeName = 'lru_cache';

    constructor(options: LRUCacheOptions = {}) {
        this.maxCacheNum = options.maxCacheNum ?? DEFAULT_MAX_CACHE_NUM;
        this.maxCacheTime = options.maxCacheTime ?? DEFAULT_MAX_CACHE_TIME;
        this.cacheMap = new Map();
        this.totalSize = 0;
        this.storageType = 'localStorage';
        this.init();
    }

    private static _instance: LRUCache<any> | null = null;

    /**
     * 获取LRUCache单例
     * @param options 可选参数，仅首次调用生效
     */
    public static getInstance(options?: LRUCacheOptions): LRUCache<any> {
        if (!LRUCache._instance) {
            LRUCache._instance = new LRUCache(options);
        }
        return LRUCache._instance;
    }

    private async init() {
        await this.loadFromStorage();
        this.updateStorageType();
        if (this.storageType === 'indexedDB') {
            await this.initIndexedDB();
        }
    }

    private updateStorageType() {
        if (this.totalSize < MAX_LOCALSTORAGE_SIZE) {
            this.storageType = 'localStorage';
        } else {
            this.storageType = 'indexedDB';
        }
    }

    private async loadFromStorage() {
        // 只加载localStorage
        const raw = localStorage.getItem('__mylru_cache__');
        if (raw) {
            try {
                const arr: LRUCacheItem<T>[] = JSON.parse(raw);
                arr.forEach(item => {
                    if (!this.isExpired(item)) {
                        this.cacheMap.set(item.key, item);
                        this.totalSize += item.size;
                    }
                });
            } catch { }
        }
    }

    private saveToLocalStorage() {
        const arr = Array.from(this.cacheMap.values());
        localStorage.setItem('__mylru_cache__', JSON.stringify(arr));
    }

    private async saveToIndexedDB() {
        if (!this.db) return;
        return new Promise<void>((resolve, reject) => {
            const tx = this.db!.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            store.clear();
            for (const item of this.cacheMap.values()) {
                store.put(item);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    private async initIndexedDB() {
        return new Promise<void>((resolve, reject) => {
            const req = indexedDB.open(this.dbName, 1);
            req.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'key' });
                }
            };
            req.onsuccess = () => {
                this.db = req.result;
                // 将localStorage数据迁移到indexedDB
                this.saveToIndexedDB().then(() => {
                    localStorage.removeItem('__mylru_cache__');
                    resolve();
                });
            };
            req.onerror = () => reject(req.error);
        });
    }

    private isExpired(item: LRUCacheItem) {
        return now() - item.timestamp > this.maxCacheTime;
    }

    private async persist() {
        this.updateStorageType();
        if (this.storageType === 'localStorage') {
            this.saveToLocalStorage();
        } else {
            await this.initIndexedDB();
        }
    }

    private prune() {
        // 删除过期或超出数量的
        for (const [key, item] of this.cacheMap) {
            if (this.isExpired(item)) {
                this.cacheMap.delete(key);
                this.totalSize -= item.size;
            }
        }
        while (this.cacheMap.size > this.maxCacheNum) {
            // LRU: Map的第一个就是最久未使用的
            const firstKey = this.cacheMap.keys().next().value;
            const item = this.cacheMap.get(firstKey);
            if (item) {
                this.totalSize -= item.size;
            }
            this.cacheMap.delete(firstKey);
        }
    }

    async set(key: string, value: T) {
        const str = JSON.stringify(value);
        const size = getByteSize(str);
        const item: LRUCacheItem<T> = {
            key,
            value,
            timestamp: now(),
            size
        };
        if (this.cacheMap.has(key)) {
            // 更新size
            const old = this.cacheMap.get(key)!;
            this.totalSize -= old.size;
        }
        this.cacheMap.set(key, item);
        this.totalSize += size;
        // LRU: 最近使用的放到最后
        this.cacheMap.delete(key);
        this.cacheMap.set(key, item);

        this.prune();
        await this.persist();
    }

    async get(key: string): Promise<T | null> {
        let item = this.cacheMap.get(key) || null;
        if (!item) {
            // indexedDB模式下尝试从indexedDB读取
            if (this.storageType === 'indexedDB' && this.db) {
                item = await this.getFromIndexedDB(key);
                if (item) {
                    this.cacheMap.set(key, item);
                    this.totalSize += item.size;
                }
            }
        }
        if (!item || this.isExpired(item)) {
            this.cacheMap.delete(key);
            await this.persist();
            return null;
        }
        // LRU: 最近使用的放到最后
        this.cacheMap.delete(key);
        this.cacheMap.set(key, item);
        await this.persist();
        return item.value;
    }

    private getFromIndexedDB(key: string): Promise<LRUCacheItem<T> | null> {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve(null);
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.get(key);
            req.onsuccess = () => {
                resolve(req.result ?? null);
            };
            req.onerror = () => resolve(null);
        });
    }

    async remove(key: string) {
        const item = this.cacheMap.get(key);
        if (item) {
            this.totalSize -= item.size;
            this.cacheMap.delete(key);
            await this.persist();
        }
    }

    async clear() {
        this.cacheMap.clear();
        this.totalSize = 0;
        if (this.storageType === 'localStorage') {
            localStorage.removeItem('__mylru_cache__');
        } else if (this.db) {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).clear();
        }
    }

    get size() {
        return this.cacheMap.size;
    }

    get totalBytes() {
        return this.totalSize;
    }
}

export default LRUCache;
