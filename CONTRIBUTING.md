# 贡献指南

感谢你对 ClawPanel 项目的关注！以下是参与贡献的相关说明。

## 开发环境要求

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | 18+ | 前端构建 |
| Rust | stable | Tauri 后端编译 |
| Tauri CLI | v2 | `cargo install tauri-cli --version "^2"` |

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/qingchencloud/clawpanel.git
cd clawpanel

# 安装前端依赖
npm install
```

#### macOS / Linux

```bash
# 启动开发模式（完整 Tauri 桌面应用）
./scripts/dev.sh

# 仅启动前端（浏览器调试，使用 mock 数据）
./scripts/dev.sh web
```

#### Windows

```powershell
# 启动开发模式（完整 Tauri 桌面应用）
npm run tauri dev

# 仅启动前端（浏览器调试，使用 mock 数据）
npm run dev
```

> Windows 开发需要安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（勾选「使用 C++ 的桌面开发」工作负载）和 [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)（Win10+ 通常已预装）。

## 项目结构

```
clawpanel/
├── src/                    # 前端源码（Vanilla JS）
│   ├── pages/              # 页面模块（每个页面导出 render 函数）
│   ├── components/         # 通用组件（侧边栏、弹窗、Toast）
│   ├── lib/                # 工具库（Tauri API 封装、主题切换）
│   ├── style/              # CSS 样式（CSS Variables 驱动）
│   ├── router.js           # Hash 路由
│   └── main.js             # 入口文件
├── src-tauri/              # Rust 后端
│   ├── src/commands/       # Tauri 命令（按功能模块拆分）
│   ├── Cargo.toml          # Rust 依赖
│   └── tauri.conf.json     # Tauri 配置
├── public/                 # 静态资源（图片、图标）
└── .github/workflows/      # CI/CD 工作流
```

### 前端页面开发约定

每个页面是一个独立 JS 模块，导出 `render()` 函数：

```javascript
export async function render() {
  const page = document.createElement('div')
  page.className = 'page'
  page.innerHTML = `<!-- 页面骨架，含加载占位符 -->`

  // 非阻塞：先返回 DOM，数据在后台异步加载
  loadData(page)
  return page
}
```

关键原则：`render()` 必须立即返回 DOM 元素，不要 `await` 数据加载，否则会阻塞页面切换。

### Rust 跨平台开发约定

平台相关代码使用条件编译：

```rust
#[cfg(target_os = "macos")]
{
    // macOS: launchctl / plist
}
#[cfg(target_os = "windows")]
{
    // Windows: openclaw CLI / tasklist
}
```

## 分支策略

- 所有开发基于 `main` 分支
- 新功能分支：`feature/功能描述`（例如 `feature/log-export`）
- 修复分支：`fix/问题描述`（例如 `fix/model-save-crash`）
- 完成后发起 PR 合并回 `main`

## 提交规范

提交信息采用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<类型>(可选范围): 简要描述
```

### 类型说明

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档变更 |
| `style` | 代码格式调整（不影响逻辑） |
| `refactor` | 重构（非新功能、非 Bug 修复） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖变更 |

### 示例

```
feat(model): 新增模型批量测试功能
fix(gateway): 修复端口配置未生效的问题
perf(router): 添加模块缓存避免重复加载
docs: 更新安装说明
```

## PR 流程

1. Fork 本仓库并克隆到本地
2. 从 `main` 创建新分支
3. 完成开发并进行本地测试
4. 确保代码风格一致、注释完整
5. 提交并推送到你的 Fork 仓库
6. 发起 Pull Request，描述清楚变更内容和测试情况
7. 等待代码审查，根据反馈修改

## 代码规范

- **前端**：使用 Vanilla JS，不引入第三方框架
- **注释**：所有代码注释使用中文
- **风格**：简洁清晰，避免过度封装
- **命名**：变量和函数使用驼峰命名（camelCase），CSS 类名使用短横线命名（kebab-case）
- **资源**：静态资源本地化，禁止引用远程 CDN
- **异步**：页面 render() 中禁止阻塞式 await，数据加载走后台异步

## 问题反馈

如果发现 Bug 或有功能建议，欢迎通过 [GitHub Issues](https://github.com/qingchencloud/clawpanel/issues) 提交。
