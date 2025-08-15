import { describe, it, expect, vi } from 'vitest'
import { useTenantDetailStore } from '../tenantDetail'
import * as admin from '../../api/admin'

vi.mock('../../api/admin', () => ({
  getTenant: vi.fn().mockResolvedValue({ id: 't1', name: 'T1' }),
  getWorkspaces: vi.fn().mockResolvedValue([]),
  getAgents: vi.fn().mockResolvedValue([]),
  getKnowledgeCollections: vi.fn().mockResolvedValue([]),
  getKnowledgeFiles: vi.fn().mockResolvedValue([]),
  getChats: vi.fn().mockResolvedValue([]),
  getChatTranscript: vi.fn().mockResolvedValue([]),
  getBilling: vi.fn().mockResolvedValue(null)
}))

describe('tenantDetail store', () => {
  it('loads tenant data', async () => {
    const store = useTenantDetailStore()
    await store.loadTenant('t1')
    expect(admin.getTenant).toHaveBeenCalledWith('t1')
    expect(store.tenant).toEqual({ id: 't1', name: 'T1' })
  })
})
