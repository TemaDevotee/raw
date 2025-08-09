import { reactive } from 'vue'
import apiClient from '@/api'

const state = reactive({
  collections: [],
  sourcesByCollection: {},
  isLoading: false,
})

async function fetchCollections(workspaceId) {
  state.isLoading = true
  try {
    const { data } = await apiClient.get('/knowledge/collections', {
      params: workspaceId ? { workspaceId } : undefined,
    })
    state.collections = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Failed to load collections', e)
    state.collections = []
  } finally {
    state.isLoading = false
  }
}

async function createCollection(name, workspaceId) {
  const trimmed = (name || '').trim()
  if (!trimmed) throw new Error('Collection name required')
  const { data } = await apiClient.post('/knowledge/collections', {
    name: trimmed,
    workspaceId,
  })
  const coll = data || { id: crypto.randomUUID(), name: trimmed, workspaceId }
  state.collections.push(coll)
  return coll
}

async function renameCollection(id, name) {
  const trimmed = (name || '').trim()
  if (!trimmed) throw new Error('Collection name required')
  const coll = state.collections.find((c) => c.id === id)
  if (!coll) throw new Error('Collection not found')
  coll.name = trimmed
  await apiClient.patch(`/knowledge/collections/${id}`, { name: trimmed })
}

async function deleteCollection(id) {
  const index = state.collections.findIndex((c) => c.id === id)
  if (index === -1) return
  state.collections.splice(index, 1)
  delete state.sourcesByCollection[id]
  await apiClient.delete(`/knowledge/collections/${id}`)
}

async function fetchSources(collectionId) {
  try {
    const { data } = await apiClient.get(`/knowledge/collections/${collectionId}/sources`)
    state.sourcesByCollection[collectionId] = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Failed to load sources', e)
    state.sourcesByCollection[collectionId] = []
  }
}

async function addUrlSource(collectionId, url) {
  const trimmed = (url || '').trim()
  if (!trimmed) throw new Error('URL required')
  const { data } = await apiClient.post(
    `/knowledge/collections/${collectionId}/sources:url`,
    { url: trimmed },
  )
  const src = data || { id: crypto.randomUUID(), type: 'url', name: trimmed, url: trimmed, status: 'queued', updatedAt: new Date().toISOString() }
  const list = state.sourcesByCollection[collectionId] || (state.sourcesByCollection[collectionId] = [])
  list.push(src)
  return src
}

export const knowledgeStore = {
  state,
  fetchCollections,
  createCollection,
  renameCollection,
  deleteCollection,
  fetchSources,
  addUrlSource,
}
