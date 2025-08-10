import { describe, it, expect, beforeEach, vi } from 'vitest'

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
  },
}))

vi.mock('@/stores/ThemingStore.js', () => ({
  default: { currentTheme: 'emerald', isDarkMode: true, init: vi.fn() },
}))

beforeEach(() => {
  vi.resetModules()
  global.localStorage = mockStorage()
  global.sessionStorage = mockStorage()
  global.window = {
    location: { assign: vi.fn() },
    _listeners: {},
    addEventListener(event, cb) {
      this._listeners[event] = cb
    },
    dispatchEvent(e) {
      const cb = this._listeners[e.type]
      if (cb) cb(e)
    },
  }
})

describe('orchestratedLogout', () => {
  it('cleans state and broadcasts', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    const { chatStore } = await import('../chatStore.js')
    const draftStore = (await import('../draftStore.js')).default
    const { orchestratedLogout } = await import('../logout.js')
    workspaceStore.createWorkspace('Extra')
    chatStore.state.chats = [{ id: '1', controlBy: 'operator', heldBy: 'u1' }]
    draftStore.state.draftsByChat['1'] = [{ id: 'd1', text: 't' }]
    localStorage.setItem('auth.token', 't')
    const api = (await import('@/api')).default
    await orchestratedLogout()
    expect(api.post).toHaveBeenCalledWith('/presence/leave', expect.anything())
    expect(workspaceStore.state.workspaces).toHaveLength(1)
    expect(chatStore.state.chats[0].controlBy).toBe('agent')
    expect(localStorage.getItem('auth.token')).toBe(null)
    expect(localStorage.getItem('auth.logoutAt')).not.toBeNull()
    expect(window.location.assign).toHaveBeenCalledWith('/login.html')
  })

  it('is idempotent', async () => {
    const { orchestratedLogout } = await import('../logout.js')
    await orchestratedLogout()
    await orchestratedLogout()
    expect(window.location.assign).toHaveBeenCalledTimes(2)
  })

  it('responds to storage event', async () => {
    const mod = await import('../logout.js')
    mod.initLogoutListener()
    window.dispatchEvent({ type: 'storage', key: 'auth.logoutAt' })
    await new Promise((r) => setTimeout(r, 0))
    expect(window.location.assign).toHaveBeenCalledWith('/login.html')
  })
})
