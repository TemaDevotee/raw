import { describe, it, expect, vi } from 'vitest'
import { useKnowledgeStore } from '../knowledge'
import * as admin from '../../api/admin'

vi.mock('../../api/admin', () => ({
  getKnowledge: vi.fn().mockResolvedValue({
    collections: [{ id: 'c1', name: 'Docs', filesCount: 0, bytes: 0 }],
    storageUsedMB: 0,
    storageQuotaMB: 100
  }),
  createCollection: vi.fn().mockResolvedValue({}),
  listFiles: vi.fn().mockResolvedValue([]),
  uploadFile: vi.fn().mockResolvedValue({}),
  deleteFile: vi.fn().mockResolvedValue({}),
  deleteCollection: vi.fn().mockResolvedValue({}),
  downloadFile: vi.fn().mockResolvedValue(new Blob())
}))

describe('knowledge store', () => {
  it('loads collections', async () => {
    const store = useKnowledgeStore()
    await store.load('t1')
    expect(admin.getKnowledge).toHaveBeenCalledWith('t1')
    expect(store.collections.length).toBe(1)
  })
})
