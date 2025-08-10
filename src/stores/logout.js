import apiClient from '@/api'
import { chatStore } from '@/stores/chatStore.js'
import { workspaceStore } from '@/stores/workspaceStore.js'
import { agentStore } from '@/stores/agentStore.js'
import langStore from '@/stores/langStore.js'
import themeStore from '@/stores/ThemingStore.js'
import { showToast } from '@/stores/toastStore'

let running = false

export async function orchestratedLogout({ force = false } = {}) {
  if (running && !force) return
  running = true
  try {
    showToast(langStore.t('loggingOut'), 'info')
    const user = JSON.parse(
      localStorage.getItem('auth.user') ||
        sessionStorage.getItem('auth.user') ||
        'null',
    ) || { id: null }
    const controlled = chatStore.state.chats.filter((c) => c.controlBy === 'operator')
    await Promise.all(
      controlled.map((c) =>
        apiClient
          .post('/presence/leave', { chatId: c.id, userId: user.id })
          .catch(() => {}),
      ),
    )
    await Promise.all(
      controlled.map((c) => apiClient.post(`/chats/${c.id}/return`).catch(() => {})),
    )

    // reset stores
    chatStore.state.drafts = {}
    chatStore.state.chats.forEach((c) => {
      c.controlBy = 'agent'
      c.heldBy = null
    })
    chatStore.state.isLoadingDrafts = false
    chatStore.state.isBulkSubmitting = false

    workspaceStore.state.workspaces = [
      { id: workspaceStore.DEFAULT_WORKSPACE_ID, name: 'Default' },
    ]
    workspaceStore.state.currentWorkspaceId =
      workspaceStore.DEFAULT_WORKSPACE_ID
    workspaceStore.persist()

    agentStore.state.manualApprove = false
    agentStore.state.knowledgeLinks = []
    agentStore.persist()
    langStore.setLang('en')

    themeStore.currentTheme = 'classic'
    themeStore.isDarkMode = false
    localStorage.removeItem('appTheme')
    localStorage.removeItem('isDarkMode')
    themeStore.init()

    // clear auth and app state storage
    localStorage.removeItem('auth.token')
    localStorage.removeItem('auth.user')
    localStorage.removeItem('authenticated')
    sessionStorage.removeItem('auth.token')
    sessionStorage.removeItem('auth.user')
    sessionStorage.removeItem('authenticated')
    localStorage.removeItem('app.state.v2')
    sessionStorage.removeItem('app.state.v2')

    // broadcast logout to other tabs
    localStorage.setItem('auth.logoutAt', Date.now().toString())

    try {
      await apiClient.post('/api/auth/logout')
    } catch { /* noop */ }
  } finally {
    running = false
    window.location.assign('/login.html')
  }
}

export function getLogoutRisk() {
  const controlCount = chatStore.state.chats.filter((c) => c.controlBy === 'operator').length
  const draftCount = Object.values(chatStore.state.drafts).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0,
  )
  return { controlCount, draftCount }
}

export function initLogoutListener() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth.logoutAt') orchestratedLogout({ force: true })
  })
}
