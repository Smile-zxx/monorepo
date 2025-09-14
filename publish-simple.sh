#!/bin/bash

# 简化版 npm 包发布脚本
# 用法: ./publish-simple.sh <package-name>

set -e

# 交互式选择包
select_package() {
    echo ""
    echo "请选择要发布的包:"
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
            echo "退出发布"
            exit 0
            ;;
        *)
            echo "❌ 无效选项，请重新选择"
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

echo "🚀 开始发布包: $PACKAGE_NAME"

# 切换到项目根目录
cd "$(dirname "$0")"

# 检查 npm 登录
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ 请先登录 npm: npm login"
    exit 1
fi

echo "✅ 已登录: $(npm whoami)"

# 设置官方 registry
npm config set registry https://registry.npmjs.org/

# 发布函数
publish() {
    local dir=$1
    echo "📦 发布 $dir..."
    cd "$dir"
    
    # 构建
    if [ -f "package.json" ] && grep -q '"build"' package.json; then
        echo "🔨 构建中..."
        pnpm build 2>/dev/null || npm run build
    fi
    
    # 发布
    npm publish
    echo "✅ $dir 发布成功"
    cd ..
}

# 发布指定包
case $PACKAGE_NAME in
    "shared")
        publish "packages/shared"
        ;;
    "test")
        publish "packages/test"
        ;;
    "all")
        publish "packages/shared"
        publish "packages/test"
        ;;
    *)
        echo "❌ 未知包名: $PACKAGE_NAME"
        exit 1
        ;;
esac

echo "🎉 发布完成！"
