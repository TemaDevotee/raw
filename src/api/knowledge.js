import apiClient from './index'

export function listCollections(workspaceId) {
  return apiClient.get('/knowledge/collections', {
    params: workspaceId ? { workspaceId } : undefined,
  })
}

export function createCollection(payload) {
  return apiClient.post('/knowledge/collections', payload)
}

export function renameCollection(id, payload) {
  return apiClient.patch(`/knowledge/collections/${id}`, payload)
}

export function deleteCollection(id) {
  return apiClient.delete(`/knowledge/collections/${id}`)
}

export function listSources(collectionId) {
  return apiClient.get(`/knowledge/collections/${collectionId}/sources`)
}

export function uploadFiles(collectionId, files, onUploadProgress) {
  const form = new FormData()
  files.forEach((f) => form.append('file', f))
  return apiClient.post(
    `/knowledge/collections/${collectionId}/sources:file`,
    form,
    { onUploadProgress }
  )
}

export function addUrl(collectionId, payload) {
  return apiClient.post(`/knowledge/collections/${collectionId}/sources:url`, payload)
}

export function addQA(collectionId, payload) {
  return apiClient.post(`/knowledge/collections/${collectionId}/sources:qa`, payload)
}

export function reindexSource(id) {
  return apiClient.post(`/knowledge/sources/${id}:reindex`)
}

export function pauseSource(id) {
  return apiClient.post(`/knowledge/sources/${id}:pause`)
}

export function resumeSource(id) {
  return apiClient.post(`/knowledge/sources/${id}:resume`)
}

export function deleteSource(id) {
  return apiClient.delete(`/knowledge/sources/${id}`)
}

export function status(collectionId) {
  return apiClient.get('/knowledge/indexing/status', {
    params: { collectionId },
  })
}

export default {
  listCollections,
  createCollection,
  renameCollection,
  deleteCollection,
  listSources,
  uploadFiles,
  addUrl,
  addQA,
  reindexSource,
  pauseSource,
  resumeSource,
  deleteSource,
  status,
}
