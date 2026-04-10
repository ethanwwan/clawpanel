#!/bin/bash
# ClawPanel 编译脚本
# 用法: ./scripts/build.sh [check|debug|release]
#   check   - 仅检查 Rust 编译（最快，不生成产物）
#   debug   - 编译 debug 版本（默认）
#   release - 编译正式发布版本（含打包）

set -e
cd "$(dirname "$0")/.."

MODE="${1:-debug}"

case "$MODE" in
  check)
    echo "🔍 检查 Rust 编译..."
    cd src-tauri && cargo check
    echo "✅ 编译检查通过"
    ;;
  debug)
    echo "🔨 编译 debug 版本..."
    echo "   1/2 构建前端..."
    npm run build
    echo "   2/2 编译 Rust..."
    cd src-tauri && cargo build
    echo "✅ Debug 编译完成"
    echo "   产物: src-tauri/target/debug/clawpanel"
    ;;
  release)
    echo "📦 编译正式发布版本..."
    npm run tauri build

    # macOS: 构建完成后执行 Ad-hoc 签名（解决"已损坏"问题）
    if [[ "$(uname)" == "Darwin" ]]; then
      APP_PATH=$(find "src-tauri/target/release/bundle/macos" -name "*.app" -maxdepth 1 2>/dev/null | head -1)
      if [ -n "$APP_PATH" ] && [ -d "$APP_PATH" ]; then
        echo ""
        echo "🔏 应用 Ad-hoc 签名..."
        if codesign --force --deep --sign - "$APP_PATH" 2>/dev/null; then
          echo "✅ 签名完成！可直接双击打开，无需 xattr 命令"
        else
          echo "⚠️ 签名可选（可能需要手动 codesign），继续..."
        fi
      fi
    fi

    echo "✅ Release 编译完成"
    echo "   产物目录: src-tauri/target/release/bundle/"
    ;;
  *)
    echo "用法: $0 [check|debug|release]"
    echo "  check   - 仅检查 Rust 编译（最快）"
    echo "  debug   - debug 版本（默认）"
    echo "  release - 正式发布版本"
    exit 1
    ;;
esac
