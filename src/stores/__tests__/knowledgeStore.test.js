import { describe, it, expect, vi, beforeEach } from 'vitest'
import { knowledgeStore } from '@/stores/knowledgeStore'
import apiClient from '@/api'

vi.mock('@/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

beforeEach(() => {
  knowledgeStore.state.collections = []
  knowledgeStore.state.sourcesByCollection = {}
  vi.resetAllMocks()
})

describe('knowledgeStore', () => {
  it('fetches collections', async () => {
    apiClient.get.mockResolvedValue({ data: [{ id: '1', name: 'Coll' }] })
    await knowledgeStore.fetchCollections()
    expect(knowledgeStore.state.collections).toHaveLength(1)
  })

  it('creates collection', async () => {
    apiClient.post.mockResolvedValue({ data: { id: '2', name: 'New' } })
    await knowledgeStore.createCollection('New')
    expect(knowledgeStore.state.collections.some((c) => c.name === 'New')).toBe(true)
  })

  it('renames collection', async () => {
    knowledgeStore.state.collections.push({ id: '3', name: 'Old' })
    apiClient.patch.mockResolvedValue({})
    await knowledgeStore.renameCollection('3', 'Renamed')
    expect(knowledgeStore.state.collections[0].name).toBe('Renamed')
  })

  it('deletes collection', async () => {
    knowledgeStore.state.collections.push({ id: '4', name: 'Del' })
    apiClient.delete.mockResolvedValue({})
    await knowledgeStore.deleteCollection('4')
    expect(knowledgeStore.state.collections).toHaveLength(0)
  })

  it('fetches sources and adds url source', async () => {
    apiClient.get.mockResolvedValueOnce({ data: [] })
    await knowledgeStore.fetchSources('1')
    expect(knowledgeStore.state.sourcesByCollection['1']).toEqual([])

    apiClient.post.mockResolvedValue({ data: { id: 's1', type: 'url', name: 'https://a', status: 'queued', updatedAt: '0' } })
    await knowledgeStore.addUrlSource('1', 'https://a')
    expect(knowledgeStore.state.sourcesByCollection['1']).toHaveLength(1)
  })
})
