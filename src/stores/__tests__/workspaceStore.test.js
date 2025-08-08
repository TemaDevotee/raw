import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function mockStorage() {
  let store = {}
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v)
    },
    removeItem: (k) => {
      delete store[k]
    },
    clear: () => {
      store = {}
    },
  }
}

vi.mock('@/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/components/ThemeSwitcher.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/LanguageSwitcher.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/WorkspaceSwitcher.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/Logo.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/stores/ThemingStore.js', () => ({ themeStore: { toggleDarkMode: vi.fn(), isDarkMode: false } }))
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }) }))

beforeEach(() => {
  vi.resetModules()
  global.localStorage = mockStorage()
})

const STORAGE_KEY = 'app.state.v2'

describe('workspaceStore', () => {
  it('hydrate creates default workspace', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    expect(workspaceStore.state.workspaces).toHaveLength(1)
    expect(workspaceStore.state.currentWorkspaceId).toBe(
      workspaceStore.DEFAULT_WORKSPACE_ID,
    )
  })

  it('hydrate validates currentWorkspaceId', async () => {
    const data = {
      workspaces: [
        { id: 'ws_default', name: 'Default' },
        { id: 'a', name: 'A' },
      ],
      currentWorkspaceId: 'missing',
      version: 2,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const { workspaceStore } = await import('../workspaceStore.js')
    expect(workspaceStore.state.currentWorkspaceId).toBe('ws_default')
  })

  it('create trims name, selects and persists', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    const ws = workspaceStore.createWorkspace('  Marketing  ')
    expect(ws.name).toBe('Marketing')
    expect(workspaceStore.state.currentWorkspaceId).toBe(ws.id)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.workspaces.some((w) => w.id === ws.id)).toBe(true)
  })

  it('create rejects empty', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    expect(() => workspaceStore.createWorkspace('  ')).toThrow()
  })

  it('select existing persists', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    const ws = workspaceStore.createWorkspace('Sales')
    workspaceStore.selectWorkspace(ws.id)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.currentWorkspaceId).toBe(ws.id)
  })

  it('select non-existing throws', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    expect(() => workspaceStore.selectWorkspace('nope')).toThrow()
  })

  it('rename trims and persists', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    const ws = workspaceStore.createWorkspace('Ops')
    workspaceStore.renameWorkspace(ws.id, '  Operations  ')
    expect(workspaceStore.state.workspaces.find((w) => w.id === ws.id).name).toBe(
      'Operations',
    )
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    const persisted = saved.workspaces.find((w) => w.id === ws.id)
    expect(persisted.name).toBe('Operations')
  })

  it('delete protects default and selects fallback', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    expect(() =>
      workspaceStore.deleteWorkspace(workspaceStore.DEFAULT_WORKSPACE_ID),
    ).toThrow()
    const a = workspaceStore.createWorkspace('A')
    const b = workspaceStore.createWorkspace('B')
    workspaceStore.selectWorkspace(a.id)
    workspaceStore.deleteWorkspace(a.id)
    expect(workspaceStore.state.workspaces.some((w) => w.id === a.id)).toBe(false)
    expect(workspaceStore.state.currentWorkspaceId).toBe(b.id)
  })

  it('hasMultiple and sidebar rendering', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    const sidebarSource = readFileSync(
      resolve('src/components/Sidebar.vue'),
      'utf8',
    )
    expect(sidebarSource).toContain('v-if="showSwitcher"')
    expect(workspaceStore.hasMultiple()).toBe(false)
    workspaceStore.createWorkspace('Next')
    expect(workspaceStore.hasMultiple()).toBe(true)
  })

  it('persist & hydrate roundtrip', async () => {
    let mod = await import('../workspaceStore.js')
    const store = mod.workspaceStore
    const a = store.createWorkspace('A')
    store.renameWorkspace(a.id, 'AA')
    store.selectWorkspace(a.id)
    const saved = localStorage.getItem(STORAGE_KEY)
    vi.resetModules()
    const { workspaceStore: rehydrated } = await import('../workspaceStore.js')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(saved)
    expect(rehydrated.state.workspaces).toEqual(store.state.workspaces)
    expect(rehydrated.state.currentWorkspaceId).toBe(a.id)
  })
})
