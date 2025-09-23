# 📦 npm 包发布指南

本目录包含用于发布 npm 包的脚本和说明。

## 🚀 快速开始

### 1. 登录 npm

```bash
npm login
```

### 2. 使用发布脚本

#### 🎯 交互式发布（推荐）

```bash
# 完整交互式发布工具
./publish-interactive.sh

# 基础交互式发布
./publish.sh

# 简化交互式发布
./publish-simple.sh
```

#### 📦 命令行发布

```bash
# 发布单个包
./publish.sh shared
./publish.sh test

# 发布所有包
./publish.sh all

# 使用简化版脚本
./publish-simple.sh shared
./publish-simple.sh test
./publish-simple.sh all
```

## 📋 脚本功能

### 🎯 交互式脚本 (`publish-interactive.sh`) - 推荐

- ✅ 完整的交互式界面
- ✅ 多选包功能
- ✅ 包信息预览
- ✅ 发布前确认
- ✅ 彩色输出和详细日志
- ✅ 完整的错误处理

### 完整版脚本 (`publish.sh`)

- ✅ 基础交互式选择
- ✅ 检查 npm 登录状态
- ✅ 自动切换到官方 registry
- ✅ 检查包是否已存在
- ✅ 自动构建包
- ✅ 彩色输出和详细日志
- ✅ 错误处理和回滚

### 简化版脚本 (`publish-simple.sh`)

- ✅ 基础交互式选择
- ✅ 基本发布功能
- ✅ 简洁的输出
- ✅ 快速执行

## 📦 可发布的包

| 包名 | 目录 | npm 包名 | 描述 |
|------|------|----------|------|
| shared | `packages/shared` | `@smileznpm/shared-utils` | 共享工具和类型 |
| test | `packages/test` | `@smileznpm/test-utils` | 测试工具和调试函数 |

## 🔧 发布前检查

1. **确保已登录 npm**
   ```bash
   npm whoami
   ```

2. **检查包配置**
   ```bash
   # 检查 shared 包
   cat packages/shared/package.json
   
   # 检查 test 包
   cat packages/test/package.json
   ```

3. **构建包**
   ```bash
   # 构建所有包
   pnpm build
   
   # 或单独构建
   cd packages/shared && pnpm build
   cd packages/test && pnpm build
   ```

## 🚨 常见问题

### 1. 包名已存在

如果包名已存在，需要更新版本号：

```bash
# 在对应包的 package.json 中更新版本
# 例如：从 "1.0.0" 改为 "1.0.1"
```

### 2. 未登录 npm

```bash
npm login
# 输入用户名、密码和邮箱
```

### 3. 权限问题

确保你的 npm 账户有发布权限，特别是对于 scoped packages (`@smileznpm/`)。

### 4. 网络问题

如果发布很慢或失败，可以尝试：

```bash
# 检查网络
npm ping

# 使用不同的 registry
npm config set registry https://registry.npmjs.org/
```

## 📝 发布后验证

发布成功后，可以验证：

```bash
# 查看包信息
npm view @smileznpm/shared-utils
npm view @smileznpm/test-utils

# 安装测试
npm install @smileznpm/shared-utils
npm install @smileznpm/test-utils
```

## 🔄 版本管理

发布新版本时：

1. 更新 `package.json` 中的版本号
2. 更新 `CHANGELOG.md`（如果有）
3. 运行发布脚本

```bash
# 示例：发布 1.0.1 版本
# 1. 修改 packages/shared/package.json 中的 version
# 2. 运行发布脚本
./publish.sh shared
```

## 📚 相关链接

- [npm 发布文档](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [npm 包管理最佳实践](https://docs.npmjs.com/packages-and-modules)
