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

vi.mock('@/api/account', () => ({ upgrade: vi.fn() }))

const STORAGE_KEY = 'account.plan.v1'

beforeEach(() => {
  vi.resetModules()
  global.localStorage = mockStorage()
})

describe('accountStore', () => {
  it('hydrate loads stored plan id', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentPlanId: 'pro' }))
    const store = (await import('../accountStore.js')).default
    expect(store.state.currentPlanId).toBe('pro')
  })

  it('setCurrentPlan persists', async () => {
    const store = (await import('../accountStore.js')).default
    store.setCurrentPlan('team')
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.currentPlanId).toBe('team')
  })

  it('upgradeTo success updates plan', async () => {
    const api = await import('@/api/account')
    api.upgrade.mockResolvedValue({})
    const store = (await import('../accountStore.js')).default
    await store.upgradeTo('pro')
    expect(store.state.currentPlanId).toBe('pro')
  })

  it('upgradeTo failure rolls back', async () => {
    const api = await import('@/api/account')
    api.upgrade.mockRejectedValue(new Error('fail'))
    const store = (await import('../accountStore.js')).default
    store.setCurrentPlan('free')
    await expect(store.upgradeTo('pro')).rejects.toThrow()
    expect(store.state.currentPlanId).toBe('free')
  })
})
