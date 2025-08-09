import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/billing', () => ({
  getUsageSummary: vi.fn(() => Promise.resolve({ data: {
    plan: 'Pro', periodStart: '', periodEnd: '', includedMonthlyTokens: 1000, usedThisPeriod: 100, topupBalance: 0, remainingInPeriod: 900, totalRemaining: 900
  } })),
  purchaseTokens: vi.fn(() => Promise.resolve({ data: {
    plan: 'Pro', periodStart: '', periodEnd: '', includedMonthlyTokens: 1000, usedThisPeriod: 100, topupBalance: 1000, remainingInPeriod: 900, totalRemaining: 1900
  } })),
}))

const STORAGE_KEY = 'billing.summary.v1'

function mockStorage() {
  let store = {}
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { store = {} },
  }
}

beforeEach(() => {
  vi.resetModules()
  global.localStorage = mockStorage()
})

describe('billingStore', () => {
  it('hydrate loads summary', async () => {
    const store = (await import('../billingStore.js')).default
    await store.hydrate()
    expect(store.state.summary.includedMonthlyTokens).toBe(1000)
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
  })

  it('purchase updates topup balance', async () => {
    const store = (await import('../billingStore.js')).default
    await store.purchase(1000)
    expect(store.state.summary.topupBalance).toBe(1000)
  })

  it('applyLocalDelta consumes topup when included exhausted', async () => {
    const store = (await import('../billingStore.js')).default
    store.state.summary = {
      includedMonthlyTokens: 100,
      usedThisPeriod: 90,
      topupBalance: 50,
      remainingInPeriod: 10,
      totalRemaining: 60,
    }
    store.applyLocalDelta(20)
    expect(store.state.summary.usedThisPeriod).toBe(110)
    expect(store.state.summary.remainingInPeriod).toBe(0)
    expect(store.state.summary.topupBalance).toBe(40)
    expect(store.state.summary.totalRemaining).toBe(40)
  })
})
