#!/bin/bash

# 交互式 npm 包发布脚本
# 支持多选、预览、确认等功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}    npm 包发布工具 (交互式)    ${NC}"
    echo -e "${PURPLE}================================${NC}"
    echo ""
}

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_header

# 检查 npm 登录状态
check_npm_login() {
    print_info "检查 npm 登录状态..."
    if ! npm whoami > /dev/null 2>&1; then
        print_error "未登录 npm，请先登录"
        echo "运行: npm login"
        exit 1
    fi
    
    NPM_USER=$(npm whoami)
    print_success "已登录 npm 用户: $NPM_USER"
    echo ""
}

# 检查 registry
check_registry() {
    CURRENT_REGISTRY=$(npm config get registry)
    print_info "当前 registry: $CURRENT_REGISTRY"
    
    if [[ "$CURRENT_REGISTRY" != "https://registry.npmjs.org/" ]]; then
        print_warning "当前 registry 不是官方 npm，正在切换到官方 registry..."
        npm config set registry https://registry.npmjs.org/
        print_success "已切换到官方 registry"
    fi
    echo ""
}

# 显示包信息
show_package_info() {
    local package_dir=$1
    local package_name=$2
    
    if [ ! -d "$package_dir" ]; then
        print_error "包目录不存在: $package_dir"
        return 1
    fi
    
    cd "$package_dir"
    
    if [ ! -f "package.json" ]; then
        print_error "package.json 不存在: $package_dir/package.json"
        return 1
    fi
    
    PACKAGE_NAME_FROM_JSON=$(node -p "require('./package.json').name")
    PACKAGE_VERSION=$(node -p "require('./package.json').version")
    PACKAGE_DESCRIPTION=$(node -p "require('./package.json').description")
    
    echo -e "${CYAN}包名:${NC} $PACKAGE_NAME_FROM_JSON"
    echo -e "${CYAN}版本:${NC} $PACKAGE_VERSION"
    echo -e "${CYAN}描述:${NC} $PACKAGE_DESCRIPTION"
    
    # 检查包是否已存在
    if npm view "$PACKAGE_NAME_FROM_JSON" > /dev/null 2>&1; then
        EXISTING_VERSION=$(npm view "$PACKAGE_NAME_FROM_JSON" version)
        echo -e "${CYAN}已存在版本:${NC} $EXISTING_VERSION"
        if [ "$PACKAGE_VERSION" = "$EXISTING_VERSION" ]; then
            print_warning "⚠️  版本 $PACKAGE_VERSION 已存在，需要更新版本号"
        else
            print_success "✅ 版本 $PACKAGE_VERSION 可以发布"
        fi
    else
        print_success "✅ 新包，可以发布"
    fi
    
    cd "$SCRIPT_DIR"
    echo ""
}

# 交互式选择包
select_packages() {
    echo -e "${YELLOW}请选择要发布的包 (可多选):${NC}"
    echo "1) shared - 发布 @smilez/shared-utils"
    echo "2) test   - 发布 @smilez/test-utils"
    echo "3) all    - 发布所有包"
    echo "4) 预览   - 查看包信息"
    echo "5) 退出"
    echo ""
    
    read -p "请输入选项 (1-5，多个选项用空格分隔): " choices
    
    SELECTED_PACKAGES=()
    
    for choice in $choices; do
        case $choice in
            1)
                SELECTED_PACKAGES+=("shared")
                ;;
            2)
                SELECTED_PACKAGES+=("test")
                ;;
            3)
                SELECTED_PACKAGES=("shared" "test")
                break
                ;;
            4)
                show_package_info "packages/shared" "@smilez/shared-utils"
                show_package_info "packages/test" "@smilez/test-utils"
                select_packages
                return
                ;;
            5)
                print_info "退出发布"
                exit 0
                ;;
            *)
                print_error "无效选项: $choice"
                select_packages
                return
                ;;
        esac
    done
    
    if [ ${#SELECTED_PACKAGES[@]} -eq 0 ]; then
        print_error "请至少选择一个包"
        select_packages
        return
    fi
}

# 确认发布
confirm_publish() {
    echo -e "${YELLOW}即将发布以下包:${NC}"
    for package in "${SELECTED_PACKAGES[@]}"; do
        echo "  - $package"
    done
    echo ""
    
    read -p "确认发布? (y/N): " confirm
    case $confirm in
        [yY]|[yY][eE][sS])
            return 0
            ;;
        *)
            print_info "取消发布"
            exit 0
            ;;
    esac
}

# 发布包
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
    if npm view "$PACKAGE_NAME_FROM_JSON" > /dev/null 2>&1; then
        EXISTING_VERSION=$(npm view "$PACKAGE_NAME_FROM_JSON" version)
        if [ "$PACKAGE_VERSION" = "$EXISTING_VERSION" ]; then
            print_error "版本 $PACKAGE_VERSION 已存在，请更新版本号"
            return 1
        fi
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

# 主函数
main() {
    check_npm_login
    check_registry
    select_packages
    confirm_publish
    
    # 发布选中的包
    for package in "${SELECTED_PACKAGES[@]}"; do
        case $package in
            "shared")
                publish_package "packages/shared" "@smilez/shared-utils"
                ;;
            "test")
                publish_package "packages/test" "@smilez/test-utils"
                ;;
        esac
    done
    
    print_success "🎉 所有包发布完成！"
}

# 运行主函数
main
