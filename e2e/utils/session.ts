import { Page, expect } from '@playwright/test'
import { API_BASE } from '../__setup__'

interface SeedData {
  agents?: Array<Record<string, any>>
  knowledge?: { collections?: any[] }
  presence?: Array<{ chatId: string; participants: any[] }>
  drafts?: Record<string, any[]>
  workspaces?: any[]
  chats?: Record<string, any>
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
      if (payload.chats !== undefined) {
        window.__e2eChatsData = payload.chats
      }
    },
    { state, user, knowledge: data.knowledge, agents: data.agents, chats: data.chats },
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

export async function seedPresence(page: Page, entries: Array<{ chatId: string; participants: any[] }>) {
  await page.request.post(`${API_BASE}/__e2e__/presence`, { data: entries })
}

export async function seedDrafts(page: Page, chatId: string, drafts: any[]) {
  await page.request.post(`${API_BASE}/__e2e__/drafts/seed`, {
    data: { chatId, drafts: drafts.map((d, i) => (typeof d === 'string' ? { id: `d-e2e-${i + 1}`, text: d } : d)) }
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

export async function waitForDraftCount(page: Page, n: number) {
  await expect(page.getByTestId('draft-count')).toHaveText(String(n))
}

export async function waitForAgentMessage(page: Page, text: string) {
  await expect(page.getByTestId('msg-agent').last()).toHaveText(text)
}

export async function waitStoreOp(page: Page, type: 'approve' | 'discard', draftId: string) {
  await page.evaluate(
    ({ type, draftId }) =>
      new Promise<void>((resolve) => {
        const handler = (e: any) => {
          if (e?.detail?.type === type && e.detail.draftId === draftId) {
            window.removeEventListener('__draft_op_done__', handler)
            resolve()
          }
        }
        window.addEventListener('__draft_op_done__', handler, { once: true })
      }),
    { type, draftId },
  )
}

export async function waitDraftCountServer(page: Page, chatId: string, n: number) {
  await expect.poll(async () => {
    const res = await page.request.get(`${MOCK_BASE}/__e2e__/drafts?chatId=${chatId}`)
    const data = await res.json()
    return Array.isArray(data) ? data.length : 0
  }, { timeout: 3000 }).toBe(n)
}
