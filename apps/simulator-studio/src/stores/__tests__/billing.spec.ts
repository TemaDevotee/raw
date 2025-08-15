import { describe, it, expect, vi } from 'vitest'
import { useBillingStore } from '../billing'
import * as admin from '../../api/admin'

vi.mock('../../api/admin', () => ({
  getBilling: vi.fn().mockResolvedValue({ billing: { plan: 'Free', tokenQuota: 1000, tokenUsed: 0, storageQuotaMB: 10, storageUsedMB: 0 }, usageBreakdown: {} }),
  getLedger: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  creditTokens: vi.fn().mockResolvedValue({}),
  debitTokens: vi.fn().mockResolvedValue({}),
  resetPeriod: vi.fn().mockResolvedValue({})
}))

describe('billing store', () => {
  it('loads summary', async () => {
    const store = useBillingStore()
    await store.load('t1')
    expect(admin.getBilling).toHaveBeenCalledWith('t1')
    expect(store.summary.plan).toBe('Free')
  })
})
