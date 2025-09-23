# 后台管理系统

基于 React + TypeScript + Arco Design 构建的现代化后台管理系统。

## 技术栈

- **React 18** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript
- **Arco Design** - 企业级 UI 组件库
- **Vite** - 快速构建工具
- **React Router** - 路由管理

## 功能特性

- 🎨 现代化 UI 设计
- 📱 响应式布局
- 🔐 权限管理
- 📊 数据可视化
- ⚡ 快速开发体验
- 🛠️ TypeScript 支持

## 页面结构

- **仪表盘** - 系统概览和统计数据
- **用户管理** - 用户信息的增删改查
- **系统设置** - 系统配置和参数设置

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 代码检查
pnpm lint

# 类型检查
pnpm type-check
```

## 项目结构

```
src/
├── components/     # 公共组件
├── pages/         # 页面组件
├── layouts/       # 布局组件
├── hooks/         # 自定义 Hooks
├── utils/         # 工具函数
├── types/         # 类型定义
├── App.tsx        # 应用入口
└── main.tsx       # 应用启动
```

## 开发指南

1. 使用 TypeScript 编写类型安全的代码
2. 遵循 Arco Design 设计规范
3. 组件采用函数式组件 + Hooks
4. 使用 React Router 进行路由管理
5. 保持代码整洁和可维护性
