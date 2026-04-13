/**
 * Hermes Agent 定时任务管理
 * 通过 Gateway /api/jobs REST API 管理 cron jobs
 */
import { t } from '../../../lib/i18n.js'
import { api } from '../../../lib/tauri-api.js'

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function render() {
  const el = document.createElement('div')
  el.className = 'page'

  let jobs = []
  let gwPort = 8642
  let gwOnline = false
  let loading = true
  let editingJob = null // null = list view, {} = create/edit form
  let busy = false
  let errorMsg = ''

  async function gw(path, opts = {}) {
    const method = (opts.method || 'GET').toUpperCase()
    return await api.hermesApiProxy(method, path, opts.body || null)
  }

  async function init() {
    try {
      const info = await api.checkHermes()
      gwPort = info?.gatewayPort || 8642
      gwOnline = !!info?.gatewayRunning
    } catch (_) {}
    if (gwOnline) await loadJobs()
    loading = false
    draw()
  }

  async function loadJobs() {
    try {
      const data = await gw('/api/jobs')
      jobs = data.jobs || []
      errorMsg = ''
    } catch (e) {
      errorMsg = String(e.message || e)
      jobs = []
    }
  }

  function draw() {
    if (editingJob) { drawForm(); return }

    el.innerHTML = `
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between">
        <h1 style="margin:0">${t('engine.hermesCronTitle')}</h1>
        <button class="btn btn-primary btn-sm hm-cron-create" ${!gwOnline ? 'disabled' : ''}>${t('engine.cronCreate')}</button>
      </div>
      ${errorMsg ? `<div style="color:var(--error);font-size:13px;margin-bottom:12px">${escHtml(errorMsg)}</div>` : ''}
      ${!gwOnline ? `<div class="card"><div class="card-body" style="padding:24px;text-align:center;color:var(--text-tertiary)">${t('engine.chatGatewayOffline')}</div></div>` : ''}
      ${gwOnline && jobs.length === 0 && !loading ? `<div class="card"><div class="card-body" style="padding:32px;text-align:center;color:var(--text-tertiary)">${t('engine.cronNoJobs')}</div></div>` : ''}
      ${gwOnline && jobs.length > 0 ? renderJobList() : ''}
    `
    bindList()
  }

  function renderJobList() {
    return `<div style="display:flex;flex-direction:column;gap:12px">${jobs.map(j => `
      <div class="card hm-cron-item" data-id="${escHtml(j.id || j.name)}">
        <div class="card-body" style="padding:14px 16px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <div style="flex:1;min-width:200px">
              <div style="font-weight:600;font-size:14px">${escHtml(j.name)}</div>
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;font-family:var(--font-mono,monospace)">${escHtml(j.schedule || '')}</div>
              ${j.prompt ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(j.prompt)}</div>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${j.paused ? 'var(--bg-tertiary)' : 'rgba(34,197,94,0.1)'};color:${j.paused ? 'var(--text-tertiary)' : 'var(--success, #22c55e)'}">${j.paused ? t('engine.cronPaused') : t('engine.cronActive')}</span>
              <button class="btn btn-sm btn-secondary hm-cron-toggle" data-id="${escHtml(j.id || j.name)}" data-paused="${j.paused ? '1' : '0'}" title="${j.paused ? 'Resume' : 'Pause'}" style="padding:4px 10px;font-size:12px">${j.paused ? '▶' : '⏸'}</button>
              <button class="btn btn-sm btn-secondary hm-cron-run" data-id="${escHtml(j.id || j.name)}" title="${t('engine.cronRunNow')}" style="padding:4px 10px;font-size:12px">⚡</button>
              <button class="btn btn-sm btn-secondary hm-cron-edit" data-id="${escHtml(j.id || j.name)}" style="padding:4px 10px;font-size:12px">✎</button>
              <button class="btn btn-sm hm-cron-del" data-id="${escHtml(j.id || j.name)}" style="padding:4px 10px;font-size:12px;color:var(--error)">✕</button>
            </div>
          </div>
        </div>
      </div>
    `).join('')}</div>`
  }

  function bindList() {
    el.querySelector('.hm-cron-create')?.addEventListener('click', () => {
      editingJob = { name: '', schedule: '0 9 * * *', prompt: '' }
      draw()
    })
    el.querySelectorAll('.hm-cron-toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id
        const paused = btn.dataset.paused === '1'
        try { await gw(`/api/jobs/${encodeURIComponent(id)}/${paused ? 'resume' : 'pause'}`, { method: 'POST' }) } catch (_) {}
        await loadJobs(); draw()
      })
    })
    el.querySelectorAll('.hm-cron-run').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await gw(`/api/jobs/${encodeURIComponent(btn.dataset.id)}/run`, { method: 'POST' }) } catch (_) {}
      })
    })
    el.querySelectorAll('.hm-cron-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const job = jobs.find(j => (j.id || j.name) === btn.dataset.id)
        if (job) { editingJob = { ...job, _editing: true }; draw() }
      })
    })
    el.querySelectorAll('.hm-cron-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('engine.cronDelete') + '?')) return
        try { await gw(`/api/jobs/${encodeURIComponent(btn.dataset.id)}`, { method: 'DELETE' }) } catch (_) {}
        await loadJobs(); draw()
      })
    })
  }

  function drawForm() {
    const isEdit = !!editingJob._editing
    const id = editingJob.id || editingJob.name
    el.innerHTML = `
      <div class="page-header"><h1 style="margin:0">${isEdit ? escHtml(editingJob.name) : t('engine.cronCreate')}</h1></div>
      ${errorMsg ? `<div style="color:var(--error);font-size:13px;margin-bottom:12px">${escHtml(errorMsg)}</div>` : ''}
      <div class="card">
        <div class="card-body" style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">${t('engine.cronName')}</label>
            <input class="input" id="hm-cron-name" value="${escHtml(editingJob.name)}" style="width:100%" ${isEdit ? 'disabled' : ''}>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">${t('engine.cronSchedule')} <span style="font-weight:400;color:var(--text-tertiary)">(cron)</span></label>
            <input class="input" id="hm-cron-schedule" value="${escHtml(editingJob.schedule || '')}" placeholder="0 9 * * *" style="width:100%">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">${t('engine.cronPrompt')}</label>
            <textarea class="input" id="hm-cron-prompt" rows="4" style="width:100%;resize:vertical;font-size:14px">${escHtml(editingJob.prompt || '')}</textarea>
          </div>
          <div style="display:flex;gap:10px;margin-top:4px">
            <button class="btn btn-primary btn-sm hm-cron-save" ${busy ? 'disabled' : ''}>${t('engine.cronSave')}</button>
            <button class="btn btn-secondary btn-sm hm-cron-cancel">${t('engine.cronCancel')}</button>
          </div>
        </div>
      </div>
    `
    el.querySelector('.hm-cron-cancel')?.addEventListener('click', () => { editingJob = null; errorMsg = ''; draw() })
    el.querySelector('.hm-cron-save')?.addEventListener('click', async () => {
      const name = el.querySelector('#hm-cron-name')?.value?.trim()
      const schedule = el.querySelector('#hm-cron-schedule')?.value?.trim()
      const prompt = el.querySelector('#hm-cron-prompt')?.value?.trim()
      if (!name || !schedule) { errorMsg = 'Name and schedule are required'; draw(); return }
      busy = true; errorMsg = ''
      try {
        if (isEdit) {
          await gw(`/api/jobs/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ schedule, prompt }) })
        } else {
          await gw('/api/jobs', { method: 'POST', body: JSON.stringify({ name, schedule, prompt }) })
        }
        editingJob = null
        await loadJobs()
      } catch (e) {
        errorMsg = String(e.message || e)
      }
      busy = false; draw()
    })
  }

  init()
  return el
}
