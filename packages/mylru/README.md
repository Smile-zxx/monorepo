# @smilez/mylru

> 轻量级浏览器端 LRU 缓存，自动在 LocalStorage 与 IndexedDB 间切换，支持过期、容量控制与持久化。

## 特性

- 最大缓存数量可配（默认 10）
- 过期时间可配（默认 10 分钟）
- 自动统计缓存总体积：小于 3MB 使用 `localStorage`，超过自动切换 `indexedDB`
- 支持持久化（页面刷新后仍可恢复）
- 提供单例 `getInstance()` 与手动 `new LRUCache()` 两种用法
- TypeScript 友好（包含类型定义）

## 安装

```bash
# npm
npm i @smilez/mylru

# pnpm
pnpm add @smilez/mylru

# yarn
yarn add @smilez/mylru
```

> 注意：该库依赖浏览器环境（`localStorage` / `indexedDB`）。SSR/Node 环境请在客户端再导入或做运行时判断。

## 快速上手

```ts
import LRUCache from '@smilez/mylru';

// 方式一：单例（推荐）
const cache = LRUCache.getInstance({
  maxCacheNum: 50,          // 最大条目数（默认 10）
  maxCacheTime: 5 * 60_000, // 过期时间 ms（默认 10 分钟）
});

await cache.set('user:1', { id: 1, name: 'Tom' });
const user = await cache.get('user:1'); // { id: 1, name: 'Tom' } | null

console.log(cache.size);       // 当前条目数量
console.log(cache.totalBytes); // 估算的字节数

// 方式二：自行创建实例
const another = new LRUCache({ maxCacheNum: 100 });
```

## API

### 类型
```ts
interface LRUCacheOptions {
  maxCacheNum?: number;   // 最大缓存数量，默认 10
  maxCacheTime?: number;  // 过期时间（毫秒），默认 10 分钟
}

// 泛型参数 T 为 value 的类型
class LRUCache<T = any> {
  constructor(options?: LRUCacheOptions)
  static getInstance(options?: LRUCacheOptions): LRUCache<any>

  // 基础能力（均为异步）
  set(key: string, value: T): Promise<void>
  get(key: string): Promise<T | null>
  remove(key: string): Promise<void>
  clear(): Promise<void>

  // 只读属性
  readonly size: number            // 当前条目数量
  readonly totalBytes: number      // 估算的总字节数
}
```

### 方法说明
- `getInstance(options?)`：返回全局单例；仅首次调用的 `options` 生效。
- `set(key, value)`：写入或更新条目，更新后会进行 LRU 调整与持久化。
- `get(key)`：读取条目，若过期或不存在返回 `null`；访问会刷新 LRU 顺序。
- `remove(key)`：删除指定条目。
- `clear()`：清空缓存及持久化存储。
- `size`：当前缓存条目数。
- `totalBytes`：内存中条目的估算总字节数（用于存储策略判断）。

## 存储与淘汰策略

- 持久化：
  - 小于 3MB 时，使用 `localStorage`，键为 `__mylru_cache__`；
  - 超过 3MB 时，自动切换为 `indexedDB`（数据库 `__mylru_cache_db__`，表 `lru_cache`）。
- 淘汰策略：
  - 每次写入后会先删除已过期条目；
  - 若条目数量超过 `maxCacheNum`，按 LRU（最久未使用）淘汰最老的条目。

## 使用建议与注意事项

- 浏览器环境依赖：该库使用 `localStorage` 与 `indexedDB`，请在客户端环境使用。
- 异步 API：由于涉及持久化与潜在的 `indexedDB` 操作，`set/get/remove/clear` 均为 `async`。
- 数据大小估算：内部通过 `JSON.stringify(value)` 后按字节计算，作为策略判断依据。
- 首次 `getInstance` 的 `options` 生效；后续调用将复用已创建的单例。

## 示例：结合过期与容量控制

```ts
import LRUCache from '@smilez/mylru';

const cache = LRUCache.getInstance({
  maxCacheNum: 20,
  maxCacheTime: 10 * 60_000,
});

await cache.set('list', Array.from({ length: 1000 }, (_, i) => i));
const list = await cache.get('list');

// 到达上限时，将自动淘汰最久未使用的条目
for (let i = 0; i < 100; i++) {
  await cache.set(`k${i}`, i);
}
```

## 常见问题（FAQ）

- 为什么在 Node/SSR 中报错？
  - 本库依赖浏览器对象（`localStorage` / `indexedDB`），请在客户端再导入或按需动态加载。
- 我可以关闭持久化吗？
  - 目前未提供开关。若有需求，可在 issue 中反馈或自行维护一个不持久化的实例分支。
- 为什么方法是异步？
  - 涉及 `indexedDB` 初始化、读写与迁移等异步流程。

## 版本与变更

- `0.1.0`：初始版本，支持 LRU、过期、LocalStorage/IndexedDB 自动切换与持久化。

## 许可证

MIT © 2025-present `smilez`
