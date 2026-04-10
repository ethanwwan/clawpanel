#!/bin/bash
# ClawPanel macOS 构建脚本 (Apple Silicon only)
# 用法: ./scripts/build-macos.sh
# 输出: src-tauri/target/release/bundle/macos/ClawPanel.app

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

# ── 完整构建（Tauri 自动处理前端 + Rust + Bundle）────────────────────────────

step "构建 macOS 应用 (aarch64)"

cd src-tauri
cargo build --release --target aarch64-apple-darwin
cd ..

ok "Rust 编译完成"

# ── 手动创建 .app Bundle ────────────────────────────────────────────────────────

step "创建 .app Bundle"

BUNDLE_DIR="src-tauri/target/release/bundle/macos"
mkdir -p "$BUNDLE_DIR/ClawPanel.app/Contents/MacOS"
mkdir -p "$BUNDLE_DIR/ClawPanel.app/Contents/Resources"

# 复制二进制
cp src-tauri/target/release/clawpanel "$BUNDLE_DIR/ClawPanel.app/Contents/MacOS/"

# 复制前端产物
cp -R dist/* "$BUNDLE_DIR/ClawPanel.app/Contents/Resources/"

# 复制图标
if [ -d src-tauri/icons ]; then
  cp -R src-tauri/icons "$BUNDLE_DIR/ClawPanel.app/Contents/Resources/"
fi

# 创建 Info.plist
cat > "$BUNDLE_DIR/ClawPanel.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>clawpanel</string>
    <key>CFBundleIdentifier</key>
    <string>ai.openclaw.clawpanel</string>
    <key>CFBundleName</key>
    <string>ClawPanel</string>
    <key>CFBundleVersion</key>
    <string>0.11.6</string>
    <key>CFBundleShortVersionString</key>
    <string>0.11.6</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>CFBundleIconFile</key>
    <string>icon.icns</string>
</dict>
</plist>
EOF

ok ".app Bundle 创建完成"

# ── Ad-hoc 签名 ───────────────────────────────────────────────────────────────

step "应用 Ad-hoc 签名"
APP_PATH="$BUNDLE_DIR/ClawPanel.app"
if codesign --force --deep --sign - "$APP_PATH" 2>/dev/null; then
  ok "签名完成"
else
  echo -e "  ${GRAY}签名可选，跳过${RESET}"
fi

# ── 输出结果 ──────────────────────────────────────────────────────────────────

echo ""
echo -e "  ${GREEN}✅ 构建成功！${RESET}"
echo -e "  ${GRAY}=====================================${RESET}"
echo ""
echo -e "  ${GREEN}APP:${RESET} ${GRAY}$APP_PATH${RESET}"
echo ""
ls -lh "$APP_PATH/Contents/MacOS/clawpanel"
echo ""

# ── 创建 DMG ──────────────────────────────────────────────────────────────────

step "创建 DMG 安装包"

DMG_DIR="src-tauri/target/release/bundle/dmg"
DMG_PATH="${DMG_DIR}/ClawPanel_0.11.6_aarch64.dmg"
mkdir -p "$DMG_DIR"

# 方法1: 使用 hdiutil 直接创建（推荐）
TEMP_DMG=$(mktemp -u)
TEMP_MNT=$(mktemp -d)

echo "  正在创建 DMG..."
echo "  源: $APP_PATH"
echo "  目标: $DMG_PATH"

# 尝试使用 hdiutil
if hdiutil create "$TEMP_DMG" -volname "ClawPanel" -srcfolder "$APP_PATH" -ov -format UDZO -quiet 2>&1; then
  mv "${TEMP_DMG}.dmg" "$DMG_PATH" 2>/dev/null || mv "$TEMP_DMG" "$DMG_PATH"
  if [ -f "$DMG_PATH" ]; then
    ok "DMG 创建成功: $DMG_PATH"
    ls -lh "$DMG_PATH"
  else
    echo "  ${GRAY}DMG 路径调整中...${RESET}"
    ls "$DMG_DIR"/*.dmg 2>/dev/null || echo "  ${GRAY}DMG 文件可能在其他位置${RESET}"
  fi
else
  # 方法2: 手动创建 DMG（备用）
  echo "  方法1失败，尝试备用方案..."

  hdiutil create "$TEMP_DMG" -volname "ClawPanel" -fs HFS+ -size 300m 2>/dev/null
  hdiutil attach "$TEMP_DMG" -mountpoint "$TEMP_MNT" 2>/dev/null
  cp -R "$APP_PATH" "$TEMP_MNT/"
  ln -s /Applications "$TEMP_MNT/Applications" 2>/dev/null || true
  hdiutil detach "$TEMP_MNT" 2>/dev/null
  hdiutil convert "$TEMP_DMG" -format UDZO -o "$DMG_PATH" 2>/dev/null
  rm -f "$TEMP_DMG" 2>/dev/null

  if [ -f "$DMG_PATH" ]; then
    ok "DMG 创建成功: $DMG_PATH"
    ls -lh "$DMG_PATH"
  else
    echo -e "  ${YELLOW}⚠ DMG 创建失败，但 .app 已就绪${RESET}"
    echo -e "  ${GRAY}手动创建 DMG: hdiutil create -volname ClawPanel -srcfolder \"$APP_PATH\" -ov -format UDZO \"$DMG_PATH\"${RESET}"
  fi
fi

rm -rf "$TEMP_MNT" 2>/dev/null

echo ""
echo -e "  ${GRAY}提示: 双击 .app 即可运行（首次可能需在系统设置中点击\"仍要打开\"）${RESET}"
echo ""
