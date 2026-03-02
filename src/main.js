/**
 * ClawPanel 入口
 */
import { registerRoute, initRouter, navigate, setDefaultRoute } from './router.js'
import { renderSidebar } from './components/sidebar.js'
import { initTheme } from './lib/theme.js'
import { detectOpenclawStatus, isOpenclawReady, isGatewayRunning, onGatewayChange, startGatewayPoll } from './lib/app-state.js'
import { api } from './lib/tauri-api.js'

// 样式
import './style/variables.css'
import './style/reset.css'
import './style/layout.css'
import './style/components.css'
import './style/pages.css'
import './style/chat.css'
import './style/agents.css'

// 初始化主题
initTheme()

const sidebar = document.getElementById('sidebar')
const content = document.getElementById('content')

async function boot() {
  await detectOpenclawStatus()

  if (isOpenclawReady()) {
    // 正常模式：注册所有页面
    registerRoute('/dashboard', () => import('./pages/dashboard.js'))
    registerRoute('/chat', () => import('./pages/chat.js'))
    registerRoute('/services', () => import('./pages/services.js'))
    registerRoute('/logs', () => import('./pages/logs.js'))
    registerRoute('/models', () => import('./pages/models.js'))
    registerRoute('/agents', () => import('./pages/agents.js'))
    registerRoute('/gateway', () => import('./pages/gateway.js'))
    registerRoute('/memory', () => import('./pages/memory.js'))
    registerRoute('/extensions', () => import('./pages/extensions.js'))
    registerRoute('/about', () => import('./pages/about.js'))
  } else {
    // 未安装模式：只注册 setup、extensions、about
    setDefaultRoute('/setup')
    registerRoute('/setup', () => import('./pages/setup.js'))
    registerRoute('/extensions', () => import('./pages/extensions.js'))
    registerRoute('/about', () => import('./pages/about.js'))
  }

  renderSidebar(sidebar)
  initRouter(content)

  // 未安装时强制跳转到 setup
  if (!isOpenclawReady()) {
    navigate('/setup')
    return
  }

  // Gateway 未启动引导横幅
  setupGatewayBanner()
  startGatewayPoll()
}

function setupGatewayBanner() {
  const banner = document.getElementById('gw-banner')
  if (!banner) return

  function update(running) {
    if (running) {
      banner.classList.add('gw-banner-hidden')
    } else {
      banner.classList.remove('gw-banner-hidden')
      banner.innerHTML = `
        <div class="gw-banner-content">
          <span class="gw-banner-icon">⚠</span>
          <span>Gateway 未启动，部分功能不可用</span>
          <button class="btn btn-sm btn-primary" id="btn-gw-start">启动 Gateway</button>
        </div>
      `
      banner.querySelector('#btn-gw-start')?.addEventListener('click', async (e) => {
        const btn = e.target
        btn.disabled = true
        btn.textContent = '启动中...'
        try {
          await api.startService('ai.openclaw.gateway')
        } catch (err) {
          btn.textContent = '启动失败，重试'
          btn.disabled = false
        }
      })
    }
  }

  update(isGatewayRunning())
  onGatewayChange(update)
}

boot()
