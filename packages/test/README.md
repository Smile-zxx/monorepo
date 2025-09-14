# @cursor-monorepo/test

测试工具和调试函数包。

## 功能

- `consoleLog()` - 带前缀的控制台输出
- `debugLog()` - 调试信息输出
- `testFunction()` - 测试函数
- `addNumbers()` - 数字相加
- `createTestConfig()` - 创建测试配置

## 安装

```bash
npm install @cursor-monorepo/test
```

## 使用

```javascript
const { consoleLog, debugLog, testFunction, addNumbers, createTestConfig } = require('@cursor-monorepo/test');

consoleLog('Hello World!'); // [TEST] Hello World!
debugLog('Debug info', { data: 'example' }); // [DEBUG] Debug info { data: 'example' }
console.log(testFunction('Developer')); // Hello from test package, Developer!
console.log(addNumbers(5, 3)); // 8

const config = createTestConfig({ timeout: 10000 });
console.log(config); // { enabled: true, timeout: 10000, retries: 3 }
```

## 许可证

MIT
