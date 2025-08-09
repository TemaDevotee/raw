import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/billing', () => ({
  recordUsage: vi.fn(() => Promise.resolve({ data: { total: 1 } })),
  aggregateUsage: vi.fn(() => Promise.resolve({ data: [] })),
}))

vi.mock('../billingStore.js', () => ({
  default: { state: { summary: null }, persist: vi.fn() },
}))

import usageStore from '../usageStore.js'
import * as billingApi from '@/api/billing'

describe('usageStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('record posts to api and updates billing summary', async () => {
    billingApi.recordUsage.mockResolvedValue({ data: { foo: 'bar' } })
    const res = await usageStore.record({ a: 1 })
    expect(billingApi.recordUsage).toHaveBeenCalledWith({ a: 1 })
    expect(res).toEqual({ foo: 'bar' })
  })

  it('aggregate calls api', async () => {
    billingApi.aggregateUsage.mockResolvedValue({ data: [{ key: 'c1', totalTokens: 10, messages: 1 }] })
    const data = await usageStore.aggregate({ groupBy: 'chat' })
    expect(billingApi.aggregateUsage).toHaveBeenCalled()
    expect(data[0].key).toBe('c1')
  })
})
