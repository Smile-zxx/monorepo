# @cursor-monorepo/shared

共享工具和类型定义包。

## 功能

- `greet()` - 问候函数
- `add()` - 数字相加
- `createUser()` - 创建用户对象
- `User` 接口 - 用户类型定义

## 安装

```bash
npm install @cursor-monorepo/shared
```

## 使用

```typescript
import { greet, add, createUser, User } from '@cursor-monorepo/shared';

console.log(greet('World')); // Hello, World!
console.log(add(2, 3)); // 5

const user: User = createUser('Alice', 'alice@example.com');
console.log(user);
```

## 许可证

MIT
