# Cursor Monorepo

这是一个基于 pnpm 的 monorepo 项目，包含共享包和应用程序。

## 项目结构

```
cursor-monorepo/
├── packages/          # 共享包
│   └── shared/        # 共享工具和类型
├── apps/              # 应用程序
│   └── web/           # Web 应用
├── tools/             # 工具和脚本
├── package.json       # 根 package.json
├── pnpm-workspace.yaml # pnpm workspace 配置
└── README.md
```

## 安装依赖

```bash
pnpm install
```

## 开发

```bash
# 构建所有包
pnpm build

# 开发模式（监听文件变化）
pnpm dev

# 运行 web 应用
cd apps/web
pnpm start
```

## 添加新包

1. 在 `packages/` 目录下创建新包
2. 添加 `package.json` 文件
3. 在根目录运行 `pnpm install` 来安装依赖

## 添加新应用

1. 在 `apps/` 目录下创建新应用
2. 添加 `package.json` 文件
3. 在根目录运行 `pnpm install` 来安装依赖

## 脚本说明

- `pnpm build` - 构建所有包
- `pnpm dev` - 开发模式
- `pnpm test` - 运行所有测试
- `pnpm lint` - 代码检查
- `pnpm clean` - 清理构建文件
