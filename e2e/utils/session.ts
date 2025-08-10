import { Page } from '@playwright/test'

interface SeedData {
  agents?: Array<Record<string, any>>
  knowledge?: { collections?: any[] }
  presence?: Array<{ chatId: string; participants: any[] }>
  drafts?: Record<string, any[]>
  workspaces?: any[]
}

export async function seedAppState(page: Page, data: SeedData = {}) {
  const state = {
    workspaces: data.workspaces || [],
    currentWorkspaceId: 'ws_default',
    version: 2,
    chats: {},
  }
  const user = { id: 'e2e', name: 'E2E' }
  await page.addInitScript(
    (payload) => {
      localStorage.setItem('__e2e__', '1')
      localStorage.setItem('app.state.v2', JSON.stringify(payload.state))
      localStorage.setItem('lang', 'en')
      localStorage.setItem('appTheme', 'forest')
      localStorage.setItem('authenticated', 'true')
      localStorage.setItem('auth.user', JSON.stringify(payload.user))
      localStorage.setItem('auth.token', 'e2e')
      localStorage.setItem('skipAuth', 'true')
      sessionStorage.setItem('authenticated', 'true')
      sessionStorage.setItem('auth.user', JSON.stringify(payload.user))
      sessionStorage.setItem('auth.token', 'e2e')
      if (payload.knowledge?.collections !== undefined) {
        window.__e2eKnowledgeCollections = payload.knowledge.collections
      }
      if (payload.agents !== undefined) {
        window.__e2eAgentsData = payload.agents
      }
    },
    { state, user, knowledge: data.knowledge, agents: data.agents },
  )

  await page.route('**/api/knowledge_groups*', (route) => {
    route.fulfill({ json: [] })
  })

  await page.route('https://fonts.googleapis.com/**', (route) => {
    route.fulfill({ status: 200, body: '' })
  })
  await page.route('https://fonts.gstatic.com/**', (route) => {
    route.fulfill({ status: 200, body: '' })
  })

  if (data.presence) {
    await seedPresence(page, data.presence)
  }
  if (data.drafts) {
    for (const [chatId, drafts] of Object.entries(data.drafts)) {
      await seedDrafts(page, chatId, drafts)
    }
  }
}

const backendBase = process.env.PLAYWRIGHT_API_URL || 'http://127.0.0.1:3001'

export async function seedPresence(page: Page, entries: Array<{ chatId: string; participants: any[] }>) {
  await page.request.post(`${backendBase}/__e2e__/presence`, { data: entries })
}

export async function seedDrafts(page: Page, chatId: string, drafts: any[]) {
  await page.request.post(`${backendBase}/__e2e__/drafts/seed`, {
    data: { chatId, drafts: drafts.map((d, i) => (typeof d === 'string' ? { id: `e2e-draft-${i}`, text: d } : d)) }
  })
}

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => (window as any).__E2E_READY__ === true, null, {
    timeout: 15_000,
  })
  await page.waitForSelector('[data-test-ready="1"]', { timeout: 15_000 })
}
