# Jest Demo - Package 测试演示

这个文档演示了如何在monorepo中为各个package配置和运行Jest测试。

## 📋 目录

- [项目结构](#项目结构)
- [Jest配置](#jest配置)
- [测试示例](#测试示例)
- [运行测试](#运行测试)
- [测试覆盖率](#测试覆盖率)
- [最佳实践](#最佳实践)

## 🏗️ 项目结构

```
packages/
├── shared/           # 共享工具包
│   ├── src/
│   │   ├── __tests__/
│   │   │   └── index.test.ts
│   │   └── index.ts
│   └── package.json
├── mylru/           # LRU缓存包
│   ├── src/
│   │   ├── __tests__/
│   │   │   └── index.test.ts
│   │   └── index.ts
│   └── package.json
├── cachereq/        # 缓存请求包
│   ├── src/
│   │   ├── __tests__/
│   │   │   └── index.test.ts
│   │   └── index.ts
│   └── package.json
└── addtest/         # 测试包
    ├── src/
    │   ├── __tests__/
    │   │   └── index.test.ts
    │   └── index.ts
    └── package.json
```

## ⚙️ Jest配置

### 根目录配置 (`jest.config.js`)

```javascript
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/packages/*/src/**/__tests__/**/*.{js,ts}',
    '<rootDir>/packages/*/src/**/*.{test,spec}.{ts,js}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true
      }
    }]
  },
  // 工作空间配置
  projects: [
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/packages/shared/**/*.{test,spec}.{ts,js}'],
      preset: 'ts-jest',
      testEnvironment: 'node'
    },
    {
      displayName: 'mylru',
      testMatch: ['<rootDir>/packages/mylru/**/*.{test,spec}.{ts,js}'],
      preset: 'ts-jest',
      testEnvironment: 'jsdom' // 需要DOM环境测试localStorage和indexedDB
    },
    // ... 其他包配置
  ]
};
```

### 全局设置 (`jest.setup.js`)

```javascript
// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 模拟浏览器环境
if (typeof globalThis.localStorage === 'undefined') {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  globalThis.localStorage = localStorageMock;
}

// 模拟 indexedDB
if (typeof globalThis.indexedDB === 'undefined') {
  globalThis.indexedDB = {
    open: jest.fn(() => ({
      onsuccess: null,
      onerror: null,
      result: {
        createObjectStore: jest.fn(),
        transaction: jest.fn()
      }
    }))
  };
}
```

## 🧪 测试示例

### 1. Shared包测试 (`packages/shared/src/__tests__/index.test.ts`)

```typescript
import { greet, add, createUser } from '../index';

describe('Shared Package Tests', () => {
  describe('greet function', () => {
    it('should return a greeting message', () => {
      const result = greet('World');
      expect(result).toBe('Hello, World!');
    });

    it('should handle special characters', () => {
      const result = greet('测试用户');
      expect(result).toBe('Hello, 测试用户!');
    });
  });

  describe('add function', () => {
    it('should add two numbers correctly', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should handle decimal numbers', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe('createUser function', () => {
    it('should create a user with valid properties', () => {
      const user = createUser('John Doe', 'john@example.com');
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });
  });
});
```

### 2. MyLRU包测试 (`packages/mylru/src/__tests__/index.test.ts`)

```typescript
import LRUCache from '../index';

// Mock localStorage and indexedDB
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('LRUCache Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (LRUCache as any)._instance = null;
  });

  describe('Basic functionality', () => {
    it('should create a new cache instance', () => {
      const cache = new LRUCache();
      expect(cache).toBeInstanceOf(LRUCache);
      expect(cache.size).toBe(0);
    });

    it('should implement singleton pattern', () => {
      const cache1 = LRUCache.getInstance();
      const cache2 = LRUCache.getInstance();
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
  });

  describe('LRU eviction', () => {
    let cache: LRUCache;

    beforeEach(() => {
      cache = new LRUCache({ maxCacheNum: 2, maxCacheTime: 60000 });
    });

    it('should evict least recently used item', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3'); // Should evict key1

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBe('value2');
      expect(await cache.get('key3')).toBe('value3');
    });
  });

  describe('Expiration', () => {
    let cache: LRUCache;

    beforeEach(() => {
      cache = new LRUCache({ maxCacheNum: 10, maxCacheTime: 100 });
    });

    it('should expire items after maxCacheTime', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(await cache.get('key1')).toBeNull();
    });
  });
});
```

### 3. CacheReq包测试 (`packages/cachereq/src/__tests__/index.test.ts`)

```typescript
import { createCacheRequest } from '../index';
import LRUCache from '@smileznpm/mylru';

// Mock LRUCache
jest.mock('@smileznpm/mylru');

const mockLRUCache = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
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
  });
});
```

## 🚀 运行测试

### 1. 安装依赖

```bash
# 安装Jest相关依赖
pnpm install

# 或者使用淘宝镜像
pnpm install-tb
```

### 2. 运行所有测试

```bash
# 运行所有包的测试
pnpm test

# 或者使用演示脚本
node scripts/test-demo.js all
```

### 3. 运行特定包的测试

```bash
# 运行特定包的测试
pnpm --filter @smileznpm/shared test
pnpm --filter @smileznpm/mylru test
pnpm --filter @smileznpm/cachereq test
pnpm --filter @smileznpm/addtest test

# 或者使用演示脚本
node scripts/test-demo.js shared
node scripts/test-demo.js mylru
node scripts/test-demo.js cachereq
node scripts/test-demo.js addtest
```

### 4. 监听模式

```bash
# 启动测试监听模式
pnpm test:watch

# 或者使用演示脚本
node scripts/test-demo.js watch
```

### 5. 使用演示脚本

```bash
# 查看帮助
node scripts/test-demo.js help

# 运行所有测试
node scripts/test-demo.js all

# 运行特定包测试
node scripts/test-demo.js shared

# 生成覆盖率报告
node scripts/test-demo.js coverage
```

## 📊 测试覆盖率

### 生成覆盖率报告

```bash
# 生成覆盖率报告
pnpm test:coverage

# 或者使用演示脚本
node scripts/test-demo.js coverage
```

### 覆盖率配置

在 `jest.config.js` 中配置了覆盖率阈值：

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### 覆盖率报告

覆盖率报告会生成在 `coverage/` 目录中，包括：

- `lcov-report/index.html` - HTML格式的详细报告
- `lcov.info` - LCOV格式的报告
- 终端输出 - 简化的覆盖率统计

## 🎯 最佳实践

### 1. 测试文件组织

```
src/
├── __tests__/           # 测试文件目录
│   ├── index.test.ts    # 主文件测试
│   ├── utils.test.ts    # 工具函数测试
│   └── __mocks__/       # Mock文件
├── index.ts
└── utils.ts
```

### 2. 测试命名规范

```typescript
describe('Component/Function Name', () => {
  describe('specific behavior', () => {
    it('should do something specific', () => {
      // 测试代码
    });
  });
});
```

### 3. 测试结构 (AAA模式)

```typescript
it('should calculate total price correctly', () => {
  // Arrange - 准备测试数据
  const items = [{ price: 10 }, { price: 20 }];
  const taxRate = 0.1;
  
  // Act - 执行被测试的功能
  const result = calculateTotal(items, taxRate);
  
  // Assert - 验证结果
  expect(result).toBe(33); // (10 + 20) * 1.1
});
```

### 4. Mock使用

```typescript
// Mock外部依赖
jest.mock('external-library');

// Mock函数
const mockFunction = jest.fn().mockReturnValue('mocked value');

// Mock模块
jest.mock('../utils', () => ({
  helperFunction: jest.fn().mockReturnValue('mocked helper')
}));
```

### 5. 异步测试

```typescript
// Promise
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected value');
});

// Callback
it('should handle callbacks', (done) => {
  callbackFunction((error, result) => {
    expect(error).toBeNull();
    expect(result).toBe('expected value');
    done();
  });
});
```

### 6. 错误测试

```typescript
it('should throw error for invalid input', () => {
  expect(() => {
    validateInput(null);
  }).toThrow('Invalid input');
});

it('should reject promise for async errors', async () => {
  await expect(asyncFunction()).rejects.toThrow('Async error');
});
```

## 🔧 故障排除

### 常见问题

1. **TypeScript编译错误**
   - 检查 `tsconfig.json` 配置
   - 确保安装了 `@types/jest`

2. **模块解析错误**
   - 检查 `jest.config.js` 中的 `moduleNameMapping`
   - 确保路径映射正确

3. **Mock不工作**
   - 确保Mock在测试文件顶部
   - 检查Mock的路径是否正确

4. **异步测试超时**
   - 增加 `testTimeout` 配置
   - 检查异步代码是否正确处理

### 调试技巧

```typescript
// 使用 console.log 调试
it('should debug values', () => {
  const result = someFunction();
  console.log('Debug result:', result);
  expect(result).toBeDefined();
});

// 使用 jest.spyOn 调试调用
it('should track function calls', () => {
  const spy = jest.spyOn(console, 'log');
  someFunction();
  expect(spy).toHaveBeenCalledWith('expected message');
});
```

## 📚 扩展阅读

- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [TypeScript + Jest](https://jestjs.io/docs/getting-started#using-typescript)
- [Jest Mock指南](https://jestjs.io/docs/mock-functions)
- [测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
