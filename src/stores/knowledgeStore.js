import { reactive } from 'vue'
import api from '@/api/knowledge'

const state = reactive({
  collections: [],
  sourcesByCollection: {},
  selectionByCollection: {},
  isLoading: false,
  isUploading: false,
  polling: {},
})

function getSources(collectionId) {
  return state.sourcesByCollection[collectionId] || (state.sourcesByCollection[collectionId] = [])
}

function getSelection(collectionId) {
  return state.selectionByCollection[collectionId] || (state.selectionByCollection[collectionId] = new Set())
}

async function fetchCollections(workspaceId) {
  state.isLoading = true
  try {
    const { data } = await api.listCollections(workspaceId)
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
  const { data } = await api.createCollection({ name: trimmed, workspaceId })
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
  await api.renameCollection(id, { name: trimmed })
}

async function deleteCollection(id) {
  const index = state.collections.findIndex((c) => c.id === id)
  if (index === -1) return
  state.collections.splice(index, 1)
  delete state.sourcesByCollection[id]
  delete state.selectionByCollection[id]
  await api.deleteCollection(id)
}

async function fetchSources(collectionId) {
  try {
    const { data } = await api.listSources(collectionId)
    state.sourcesByCollection[collectionId] = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Failed to load sources', e)
    state.sourcesByCollection[collectionId] = []
  }
}

async function addUrlSource(collectionId, url) {
  const trimmed = (url || '').trim()
  if (!trimmed) throw new Error('URL required')
  const { data } = await api.addUrl(collectionId, { url: trimmed })
  const src =
    data || {
      id: crypto.randomUUID(),
      type: 'url',
      name: trimmed,
      url: trimmed,
      status: 'queued',
      updatedAt: new Date().toISOString(),
    }
  getSources(collectionId).push(src)
  startPolling(collectionId)
  return src
}

async function addQASource(collectionId, question, answer) {
  const q = (question || '').trim()
  const a = (answer || '').trim()
  if (!q || !a) throw new Error('Question and answer required')
  const { data } = await api.addQA(collectionId, { question: q, answer: a })
  const src =
    data || {
      id: crypto.randomUUID(),
      type: 'qa',
      name: q,
      qa: { question: q, answer: a },
      status: 'queued',
      updatedAt: new Date().toISOString(),
    }
  getSources(collectionId).push(src)
  startPolling(collectionId)
  return src
}

async function uploadFiles(collectionId, files) {
  if (!files || !files.length) return
  const list = getSources(collectionId)
  const entries = Array.from(files).map((f) => ({
    id: crypto.randomUUID(),
    type: 'file',
    name: f.name,
    size: f.size,
    status: 'queued',
    progress: 0,
    updatedAt: new Date().toISOString(),
    _file: f,
  }))
  list.push(...entries)
  state.isUploading = true
  try {
    await api.uploadFiles(collectionId, Array.from(files), (evt) => {
      const percent = Math.round((evt.loaded / evt.total) * 100)
      entries.forEach((e) => (e.progress = percent))
    })
    entries.forEach((e) => {
      e.status = 'processing'
      e.progress = 100
      delete e._file
    })
    startPolling(collectionId)
  } catch (e) {
    console.error('Upload failed', e)
    entries.forEach((e) => {
      e.status = 'error'
      e.error = 'upload'
    })
  } finally {
    state.isUploading = false
  }
}

function selectSource(collectionId, id, value) {
  const set = getSelection(collectionId)
  if (value) set.add(id)
  else set.delete(id)
}

function clearSelection(collectionId) {
  getSelection(collectionId).clear()
}

function selectAll(collectionId, ids) {
  const set = getSelection(collectionId)
  set.clear()
  ids.forEach((i) => set.add(i))
}

async function reindexSource(collectionId, id) {
  const list = getSources(collectionId)
  const item = list.find((s) => s.id === id)
  if (!item) return
  const prev = item.status
  item.status = 'queued'
  try {
    await api.reindexSource(id)
    startPolling(collectionId)
  } catch (e) {
    item.status = prev
    console.error('Failed reindex', e)
  }
}

async function pauseSource(collectionId, id) {
  const list = getSources(collectionId)
  const item = list.find((s) => s.id === id)
  if (!item) return
  const prev = item.status
  item.status = 'paused'
  try {
    await api.pauseSource(id)
  } catch (e) {
    item.status = prev
    console.error('Failed pause', e)
  }
}

async function resumeSource(collectionId, id) {
  const list = getSources(collectionId)
  const item = list.find((s) => s.id === id)
  if (!item) return
  const prev = item.status
  item.status = 'processing'
  try {
    await api.resumeSource(id)
    startPolling(collectionId)
  } catch (e) {
    item.status = prev
    console.error('Failed resume', e)
  }
}

async function deleteSources(collectionId, ids) {
  const list = getSources(collectionId)
  const toRemove = new Set(ids)
  state.selectionByCollection[collectionId] = new Set()
  const removed = list.filter((s) => toRemove.has(s.id))
  state.sourcesByCollection[collectionId] = list.filter((s) => !toRemove.has(s.id))
  try {
    await Promise.all(removed.map((s) => api.deleteSource(s.id)))
  } catch (e) {
    console.error('Failed delete', e)
  }
}

async function batchAction(collectionId, ids, action) {
  const promises = ids.map((id) => {
    if (action === 'reindex') return reindexSource(collectionId, id)
    if (action === 'pause') return pauseSource(collectionId, id)
    if (action === 'resume') return resumeSource(collectionId, id)
    if (action === 'delete') return deleteSources(collectionId, [id])
    return Promise.resolve()
  })
  await Promise.all(promises)
}

function startPolling(collectionId) {
  const poll = state.polling[collectionId] || (state.polling[collectionId] = { active: false })
  if (poll.active) return
  poll.active = true
  const tick = async () => {
    try {
      const { data } = await api.status(collectionId)
      if (Array.isArray(data)) {
        const list = getSources(collectionId)
        data.forEach((upd) => {
          const item = list.find((s) => s.id === upd.id)
          if (item) Object.assign(item, upd)
        })
      }
    } catch (e) {
      console.error('Polling failed', e)
    }
    const list = getSources(collectionId)
    if (list.some((s) => ['queued', 'processing', 'paused'].includes(s.status))) {
      poll.timer = setTimeout(tick, 4000)
    } else {
      poll.active = false
    }
  }
  tick()
}

export const knowledgeStore = {
  state,
  fetchCollections,
  createCollection,
  renameCollection,
  deleteCollection,
  fetchSources,
  addUrlSource,
  addQASource,
  uploadFiles,
  selectSource,
  selectAll,
  clearSelection,
  reindexSource,
  pauseSource,
  resumeSource,
  deleteSources,
  batchAction,
  startPolling,
}
