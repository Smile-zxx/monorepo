/** @type {import('jest').Config} */
module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 项目根目录
  rootDir: '.',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/packages/*/src/**/__tests__/**/*.{js,ts}',
    '<rootDir>/packages/*/src/**/*.{test,spec}.{js,ts}',
    '<rootDir>/packages/*/test/**/*.{js,ts}',
    '<rootDir>/packages/*/tests/**/*.{js,ts}'
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // TypeScript 转换配置
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
  
  // 忽略转换的模块
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  
  // 模块名映射
  moduleNameMapping: {
    '^@smileznpm/(.*)$': '<rootDir>/packages/$1/src'
  },
  
  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/index.ts'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // 清理模拟
  clearMocks: true,
  restoreMocks: true,
  
  // 测试超时时间
  testTimeout: 10000,
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
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
    {
      displayName: 'cachereq',
      testMatch: ['<rootDir>/packages/cachereq/**/*.{test,spec}.{ts,js}'],
      preset: 'ts-jest',
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'addtest',
      testMatch: ['<rootDir>/packages/addtest/**/*.{test,spec}.{ts,js}'],
      preset: 'ts-jest',
      testEnvironment: 'node'
    },
    {
      displayName: 'langgraph',
      testMatch: ['<rootDir>/packages/langgraph/**/*.{test,spec}.{ts,js}'],
      preset: 'ts-jest',
      testEnvironment: 'node'
    }
  ]
};
