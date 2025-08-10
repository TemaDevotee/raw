import { describe, it, expect, vi, beforeEach } from 'vitest'
import { knowledgeStore } from '@/stores/knowledgeStore'
import api from '@/api/knowledge'
import { authStore } from '@/stores/authStore'

vi.mock('@/api/knowledge', () => ({
  default: {
    listCollections: vi.fn(),
    createCollection: vi.fn(),
    renameCollection: vi.fn(),
    deleteCollection: vi.fn(),
    updatePermissions: vi.fn(),
    listSources: vi.fn(),
    addUrl: vi.fn(),
    addQA: vi.fn(),
    uploadFiles: vi.fn(),
    reindexSource: vi.fn(),
    pauseSource: vi.fn(),
    resumeSource: vi.fn(),
    deleteSource: vi.fn(),
    status: vi.fn(),
  },
}))
vi.mock('@/stores/authStore', () => ({ authStore: { state: { user: { id: 'u1' } } } }))

beforeEach(() => {
  knowledgeStore.state.collections = []
  knowledgeStore.state.sourcesByCollection = {}
  knowledgeStore.state.selectionByCollection = {}
  globalThis.localStorage = {
    store: {},
    getItem(key) {
      return this.store[key] || null
    },
    setItem(key, val) {
      this.store[key] = String(val)
    },
    removeItem(key) {
      delete this.store[key]
    },
    clear() {
      this.store = {}
    },
  }
  vi.resetAllMocks()
})

describe('knowledgeStore', () => {
  it('fetches collections', async () => {
    api.listCollections.mockResolvedValue({ data: [{ id: '1', name: 'Coll', createdAt: '0', sourceCount: 0 }] })
    await knowledgeStore.fetchCollections()
    expect(knowledgeStore.state.collections).toHaveLength(1)
  })

  it('creates collection', async () => {
    api.createCollection.mockResolvedValue({ data: { id: 'n1', name: 'New', createdAt: '0', sourceCount: 0 } })
    await knowledgeStore.createCollection({ name: 'New' })
    expect(knowledgeStore.state.collections.some((c) => c.name === 'New')).toBe(true)
  })

  it('renames collection', async () => {
    knowledgeStore.state.collections.push({ id: '3', name: 'Old' })
    api.renameCollection.mockResolvedValue({})
    await knowledgeStore.renameCollection('3', 'Renamed')
    expect(knowledgeStore.state.collections[0].name).toBe('Renamed')
  })

  it('deletes collection', async () => {
    knowledgeStore.state.collections.push({ id: '4', name: 'Del' })
    api.deleteCollection.mockResolvedValue({})
    await knowledgeStore.deleteCollection('4')
    expect(knowledgeStore.state.collections).toHaveLength(0)
  })

  it('fetches sources and adds url source', async () => {
    api.listSources.mockResolvedValueOnce({ data: [] })
    api.status.mockResolvedValue({ data: [] })
    await knowledgeStore.fetchSources('1')
    expect(knowledgeStore.state.sourcesByCollection['1']).toEqual([])
    api.addUrl.mockResolvedValue({ data: { id: 's1', type: 'url', name: 'https://a', status: 'queued', updatedAt: '0' } })
    await knowledgeStore.addUrlSource('1', 'https://a')
    expect(knowledgeStore.state.sourcesByCollection['1']).toHaveLength(1)
  })

  it('adds QA source', async () => {
    api.addQA.mockResolvedValue({ data: { id: 'q1', type: 'qa', name: 'Q', qa: { question: 'Q', answer: 'A' }, status: 'queued', updatedAt: '0' } })
    await knowledgeStore.addQASource('1', 'Q', 'A')
    expect(knowledgeStore.state.sourcesByCollection['1']).toHaveLength(1)
  })

  it('uploads files', async () => {
    const file = new File(['data'], 'a.txt', { type: 'text/plain' })
    api.uploadFiles.mockResolvedValue({})
    await knowledgeStore.uploadFiles('1', [file])
    expect(knowledgeStore.state.sourcesByCollection['1'][0].name).toBe('a.txt')
  })

  it('reindex/pause/resume/delete work', async () => {
    knowledgeStore.state.sourcesByCollection['1'] = [
      { id: 's1', name: 'a', status: 'ready' },
    ]
    api.reindexSource.mockResolvedValue({})
    await knowledgeStore.reindexSource('1', 's1')
    expect(knowledgeStore.state.sourcesByCollection['1'][0].status).toBe('queued')

    api.pauseSource.mockResolvedValue({})
    await knowledgeStore.pauseSource('1', 's1')
    expect(knowledgeStore.state.sourcesByCollection['1'][0].status).toBe('paused')

    api.resumeSource.mockResolvedValue({})
    await knowledgeStore.resumeSource('1', 's1')
    expect(knowledgeStore.state.sourcesByCollection['1'][0].status).toBe('processing')

    api.deleteSource.mockResolvedValue({})
    await knowledgeStore.deleteSources('1', ['s1'])
    expect(knowledgeStore.state.sourcesByCollection['1']).toHaveLength(0)
  })

  it('updates permissions and hides collection when not allowed', async () => {
    knowledgeStore.state.collections.push({ id: 'p1', name: 'P', visibility: 'public', editors: [] })
    api.updatePermissions.mockResolvedValue({})
    authStore.state.user = { id: 'u1' }
    await knowledgeStore.updatePermissions('p1', { visibility: 'private', editors: [] })
    expect(knowledgeStore.state.collections.find((c) => c.id === 'p1')).toBeUndefined()
  })

  it('rolls back permissions on failure', async () => {
    knowledgeStore.state.collections.push({ id: 'p2', name: 'P', visibility: 'public', editors: [] })
    api.updatePermissions.mockRejectedValue(new Error('fail'))
    await expect(
      knowledgeStore.updatePermissions('p2', { visibility: 'private', editors: [] })
    ).rejects.toThrow()
    expect(knowledgeStore.state.collections[0].visibility).toBe('public')
  })

})
