#!/bin/bash
# ClawPanel macOS 构建脚本 (Apple Silicon only)
# 用法: ./scripts/build-macos.sh
# 输出: src-tauri/target/release/bundle/macos/ClawPanel_*.dmg
# 依赖环境变量: TAG_NAME (如 v0.12.0)

set -e
cd "$(dirname "$0")/.."

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
MAGENTA='\033[0;35m'; GRAY='\033[0;90m'; RESET='\033[0m'

step()  { echo -e "\n${CYAN}▶ $1${RESET}"; }
ok()    { echo -e "  ${GREEN}✓ $1${RESET}"; }
fail()  { echo -e "  ${RED}✗ $1${RESET}"; exit 1; }

echo ""
echo -e "  ${MAGENTA}ClawPanel macOS 构建工具${RESET}"
echo -e "  ${GRAY}=====================================${RESET}"
echo -e "  ${GRAY}平台: macOS Apple Silicon (aarch64)${RESET}"
echo ""

# ── 环境检测 ──────────────────────────────────────────────────────────────────

step "检查构建依赖"

if ! command -v node &>/dev/null; then
  fail "未找到 Node.js"
fi
ok "Node.js $(node --version)"

if ! command -v cargo &>/dev/null; then
  fail "未找到 Rust"
fi
ok "Rust $(rustc --version)"

if ! command -v xcode-select &>/dev/null || ! xcode-select -p &>/dev/null 2>&1; then
  fail "缺少 Xcode Command Line Tools"
fi
ok "Xcode Command Line Tools"

# ── 依赖安装 ──────────────────────────────────────────────────────────────────

step "安装前端依赖"
if [ ! -d "node_modules" ]; then
  npm install
fi
ok "依赖就绪"

# ── 清理旧产物 ──────────────────────────────────────────────────────────────────

step "清理旧产物"
rm -rf src-tauri/target/release/bundle/macos/ClawPanel.app
rm -rf src-tauri/target/release/bundle/dmg/*.dmg
ok "清理完成"

# ── 添加 Rust 编译目标 ──────────────────────────────────────────────────────────

step "添加 Rust 编译目标"
rustup target add aarch64-apple-darwin 2>/dev/null || true
ok "目标已添加"

# ── 构建 Tauri 应用 ──────────────────────────────────────────────────────────

step "构建 macOS 应用 (aarch64)"
cd src-tauri
npx tauri build --target aarch64-apple-darwin
cd ..

ok "构建完成"

# ── 查找 DMG ──────────────────────────────────────────────────────────────────

step "查找 DMG 文件"
DMG_PATH=$(find src-tauri/target/release/bundle -name "*.dmg" 2>/dev/null | head -1)
if [ -z "$DMG_PATH" ]; then
  fail "未找到 DMG 文件"
fi
ok "找到 DMG: $DMG_PATH"

# ── 输出结果 ──────────────────────────────────────────────────────────────────

echo ""
echo -e "  ${GREEN}✅ 构建成功！${RESET}"
echo -e "  ${GRAY}=====================================${RESET}"
echo ""
echo -e "  ${GREEN}DMG:${RESET} ${GRAY}$DMG_PATH${RESET}"
ls -lh "$DMG_PATH"
echo ""
