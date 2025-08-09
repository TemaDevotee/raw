import { Page } from '@playwright/test'

export async function seedAppState(page: Page) {
  const state = {
    workspaces: [],
    currentWorkspaceId: 'ws_default',
    version: 2,
    chats: {},
  }
  const user = { id: 'e2e', name: 'E2E' }
  await page.addInitScript((payload) => {
    localStorage.setItem('__e2e__', '1')
    localStorage.setItem('app.state.v2', JSON.stringify(payload.state))
    localStorage.setItem('lang', 'ru')
    localStorage.setItem('appTheme', 'forest')
    localStorage.setItem('authenticated', 'true')
    localStorage.setItem('auth.user', JSON.stringify(payload.user))
    localStorage.setItem('auth.token', 'e2e')
    localStorage.setItem('skipAuth', 'true')
    sessionStorage.setItem('authenticated', 'true')
    sessionStorage.setItem('auth.user', JSON.stringify(payload.user))
    sessionStorage.setItem('auth.token', 'e2e')
  }, { state, user })
}
