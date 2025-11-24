## COCO CLI

一个基于 LLM 的任务编排 CLI：`repoTools/coco.js`。

### 运行

```bash
pnpm coco --help
pnpm coco --list-tools
pnpm coco "在 apps/admin 下执行 pnpm dev 并输出日志"
pnpm coco --tool shell --input '{"command":"echo hello"}'
```

### 环境变量

- `COCO_LLM_API_KEY` 或 `OPENAI_API_KEY`
- `COCO_LLM_BASE_URL`（可选，默认 `https://api.openai.com/v1`）
- `COCO_LLM_MODEL`（可选，默认 `gpt-4o-mini`）

### 自定义工具

在 `repoTools/tools/` 目录新增 JS 文件，导出：

```js
module.exports = {
  name: 'echo',
  description: '打印输入文本',
  schema: { /* JSON Schema */ },
  run: async (input, ctx) => ({ ok: true })
}
```

# Cursor Monorepo

这是一个基于 pnpm 的 monorepo 项目，包含共享包和应用程序。

## 📁 项目结构

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

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
# 构建所有包
pnpm build

# 开发模式（监听文件变化）
pnpm dev

# 运行 web 应用
cd apps/web
pnpm start
```

## 📦 包管理

### 添加新包

1. 在 `packages/` 目录下创建新包
2. 添加 `package.json` 文件
3. 在根目录运行 `pnpm install` 来安装依赖

### 添加新应用

1. 在 `apps/` 目录下创建新应用
2. 添加 `package.json` 文件
3. 在根目录运行 `pnpm install` 来安装依赖

## 📋 脚本说明

| 命令 | 描述 |
|------|------|
| `pnpm build` | 构建所有包 |
| `pnpm dev` | 开发模式 |
| `pnpm test` | 运行所有测试 |
| `pnpm lint` | 代码检查 |
| `pnpm clean` | 清理构建文件 |

## 📦 发布到 npm

### 🎯 交互式发布（推荐）

```bash
# 完整交互式发布工具
./publish-interactive.sh

# 基础交互式发布
./publish.sh

# 简化交互式发布
./publish-simple.sh
```

### 命令行发布

```bash
# 发布单个包
./publish.sh shared    # 发布 @smileznpm/shared-utils
./publish.sh test      # 发布 @smileznpm/test-utils

# 发布所有包
./publish.sh all

# 使用简化版脚本
./publish-simple.sh shared
```

### 发布前准备

1. **登录 npm**
   ```bash
   npm login
   ```

2. **检查包配置**
   ```bash
   # 确保包名和版本正确
   cat packages/shared/package.json
   cat packages/test/package.json
   ```

详细说明请查看 [PUBLISH.md](./PUBLISH.md)

