import apiClient from './index'

export function listCollections(tenantId) {
  return apiClient.get('/knowledge/collections', {
    params: tenantId ? { tenantId } : undefined,
  })
}

export function createCollection(payload) {
  return apiClient.post('/knowledge/collections', payload)
}

export function listSources(collectionId) {
  return apiClient.get('/knowledge/sources', { params: { collectionId } })
}

export function uploadFiles(tenantId, collectionId, files, onUploadProgress) {
  const form = new FormData()
  form.append('tenantId', tenantId)
  form.append('collectionId', collectionId)
  if (files && files[0]) form.append('file', files[0])
  return apiClient.post('/knowledge/upload', form, { onUploadProgress })
}

export function deleteSource(id) {
  return apiClient.delete(`/knowledge/sources/${id}`)
}

export default {
  listCollections,
  createCollection,
  listSources,
  uploadFiles,
  deleteSource,
}
