// Jest 全局设置文件

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 模拟浏览器环境（用于测试需要DOM的包）
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {};
}

// 模拟 localStorage
if (typeof globalThis.localStorage === 'undefined') {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  };
  globalThis.localStorage = localStorageMock;
}

// 模拟 indexedDB
if (typeof globalThis.indexedDB === 'undefined') {
  globalThis.indexedDB = {
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
}

// 全局测试工具函数
globalThis.testUtils = {
  // 等待异步操作完成
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 模拟用户操作
  mockUserInteraction: () => ({
    click: jest.fn(),
    type: jest.fn(),
    hover: jest.fn()
  }),
  
  // 创建测试数据
  createMockData: (type = 'default') => {
    switch (type) {
      case 'user':
        return {
          id: 'test-user-123',
          name: 'Test User',
          email: 'test@example.com'
        };
      case 'cache':
        return {
          key: 'test-key',
          value: { data: 'test-value' },
          timestamp: Date.now()
        };
      default:
        return { id: 'test-id', value: 'test-value' };
    }
  }
};

// 清理函数
afterEach(() => {
  // 清理所有模拟
  jest.clearAllMocks();
  
  // 清理 localStorage
  if (globalThis.localStorage && globalThis.localStorage.clear) {
    globalThis.localStorage.clear();
  }
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
