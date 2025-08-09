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
    const chatIds = Object.keys(chatStore.state.chatControl || {})
    await Promise.all(
      chatIds.map((id) =>
        apiClient
          .post('/presence/leave', { chatId: id, userId: user.id })
          .catch(() => {}),
      ),
    )
    await Promise.all(
      chatIds
        .filter((id) => chatStore.state.chatControl[id] === 'operator')
        .map((id) =>
          apiClient.post(`/chats/${id}/return`).catch(() => {}),
        ),
    )

    // reset stores
    chatStore.state.drafts = {}
    chatStore.state.chatControl = {}
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
  const controlCount = Object.values(chatStore.state.chatControl).filter(
    (v) => v === 'operator',
  ).length
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
