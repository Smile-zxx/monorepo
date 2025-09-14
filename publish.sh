#!/bin/bash

# npm 包发布脚本
# 用法: ./publish.sh <package-name>
# 例如: ./publish.sh shared 或 ./publish.sh test

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 交互式选择包
select_package() {
    echo ""
    print_info "请选择要发布的包:"
    echo "1) shared - 发布 @smilez/shared-utils"
    echo "2) test   - 发布 @smilez/test-utils"
    echo "3) all    - 发布所有包"
    echo "4) 退出"
    echo ""
    read -p "请输入选项 (1-4): " choice
    
    case $choice in
        1)
            PACKAGE_NAME="shared"
            ;;
        2)
            PACKAGE_NAME="test"
            ;;
        3)
            PACKAGE_NAME="all"
            ;;
        4)
            print_info "退出发布"
            exit 0
            ;;
        *)
            print_error "无效选项，请重新选择"
            select_package
            ;;
    esac
}

# 检查参数或使用交互式选择
if [ $# -eq 0 ]; then
    select_package
else
    PACKAGE_NAME=$1
fi

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_info "项目根目录: $SCRIPT_DIR"

# 检查 npm 登录状态
print_info "检查 npm 登录状态..."
if ! npm whoami > /dev/null 2>&1; then
    print_error "未登录 npm，请先登录"
    echo "运行: npm login"
    exit 1
fi

NPM_USER=$(npm whoami)
print_success "已登录 npm 用户: $NPM_USER"

# 检查 registry
CURRENT_REGISTRY=$(npm config get registry)
print_info "当前 registry: $CURRENT_REGISTRY"

if [[ "$CURRENT_REGISTRY" != "https://registry.npmjs.org/" ]]; then
    print_warning "当前 registry 不是官方 npm，正在切换到官方 registry..."
    npm config set registry https://registry.npmjs.org/
    print_success "已切换到官方 registry"
fi

# 发布函数
publish_package() {
    local package_dir=$1
    local package_name=$2
    
    print_info "准备发布包: $package_name"
    
    if [ ! -d "$package_dir" ]; then
        print_error "包目录不存在: $package_dir"
        return 1
    fi
    
    cd "$package_dir"
    
    # 检查 package.json 是否存在
    if [ ! -f "package.json" ]; then
        print_error "package.json 不存在: $package_dir/package.json"
        return 1
    fi
    
    # 获取包名和版本
    PACKAGE_NAME_FROM_JSON=$(node -p "require('./package.json').name")
    PACKAGE_VERSION=$(node -p "require('./package.json').version")
    
    print_info "包名: $PACKAGE_NAME_FROM_JSON"
    print_info "版本: $PACKAGE_VERSION"
    
    # 检查包是否已存在
    print_info "检查包是否已存在..."
    if npm view "$PACKAGE_NAME_FROM_JSON" > /dev/null 2>&1; then
        EXISTING_VERSION=$(npm view "$PACKAGE_NAME_FROM_JSON" version)
        print_warning "包已存在，当前版本: $EXISTING_VERSION"
        
        if [ "$PACKAGE_VERSION" = "$EXISTING_VERSION" ]; then
            print_error "版本 $PACKAGE_VERSION 已存在，请更新版本号"
            return 1
        fi
    else
        print_info "包不存在，可以发布新包"
    fi
    
    # 构建包（如果有构建脚本）
    if grep -q '"build"' package.json; then
        print_info "构建包..."
        if command -v pnpm > /dev/null 2>&1; then
            pnpm build
        else
            npm run build
        fi
        print_success "构建完成"
    fi
    
    # 发布包
    print_info "发布包到 npm..."
    if npm publish; then
        print_success "✅ 成功发布 $PACKAGE_NAME_FROM_JSON@$PACKAGE_VERSION"
        print_info "包地址: https://www.npmjs.com/package/$PACKAGE_NAME_FROM_JSON"
    else
        print_error "❌ 发布失败"
        return 1
    fi
    
    cd "$SCRIPT_DIR"
}

# 根据参数发布对应的包
case $PACKAGE_NAME in
    "shared")
        publish_package "packages/shared" "@smilez/shared-utils"
        ;;
    "test")
        publish_package "packages/test" "@smilez/test-utils"
        ;;
    "all")
        print_info "发布所有包..."
        publish_package "packages/shared" "@smilez/shared-utils"
        publish_package "packages/test" "@smilez/test-utils"
        print_success "🎉 所有包发布完成！"
        ;;
    *)
        print_error "未知的包名: $PACKAGE_NAME"
        echo "可用的包:"
        echo "  shared - 发布 @smilez/shared-utils"
        echo "  test   - 发布 @smilez/test-utils"
        echo "  all    - 发布所有包"
        exit 1
        ;;
esac

print_success "🎉 发布完成！"
