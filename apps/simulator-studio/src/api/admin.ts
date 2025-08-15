import { get, post, del, upload, download } from './http'

export function getTenants(params?: Record<string, any>) {
  return get('/admin/tenants', params)
}

export function getTenant(id: string) {
  return get(`/admin/tenants/${id}`)
}

export function getWorkspaces(tenantId: string) {
  return get(`/admin/tenants/${tenantId}/workspaces`)
}

export function getAgents(tenantId: string) {
  return get(`/admin/tenants/${tenantId}/agents`)
}

export function getKnowledge(tenantId: string) {
  return get('/admin/knowledge', { tenantId })
}

export function createCollection(body: any) {
  return post('/admin/knowledge/collections', body)
}

export function deleteCollection(id: string) {
  return del(`/admin/knowledge/collections/${id}`)
}

export function listFiles(collectionId: string) {
  return get(`/admin/knowledge/collections/${collectionId}/files`)
}

export function uploadFile(collectionId: string, file: File, onProgress?: (n: number) => void) {
  return upload(`/admin/knowledge/collections/${collectionId}/files`, file, onProgress)
}

export function downloadFile(fileId: string) {
  return download(`/admin/knowledge/files/${fileId}`)
}

export function deleteFile(fileId: string) {
  return del(`/admin/knowledge/files/${fileId}`)
}

export function getChats(tenantId: string, params?: Record<string, any>) {
  return get('/admin/chats', { tenantId, ...params })
}

export function getChatTranscript(chatId: string, since?: number) {
  return get(`/admin/chats/${chatId}/transcript`, since ? { since } : undefined)
}

export function getChatDrafts(chatId: string, since?: number) {
  return get(`/admin/chats/${chatId}/drafts`, since ? { since } : undefined)
}

export function createChat(payload: any) {
  return post('/admin/chats', payload)
}

export function postMessage(chatId: string, body: any) {
  return post(`/admin/chats/${chatId}/messages`, body)
}

export function createDraft(chatId: string, body: any) {
  return post(`/admin/chats/${chatId}/drafts`, body)
}

export function approveDraft(chatId: string, draftId: string) {
  return post(`/admin/chats/${chatId}/drafts/${draftId}/approve`)
}

export function discardDraft(chatId: string, draftId: string) {
  return post(`/admin/chats/${chatId}/drafts/${draftId}/discard`)
}

export function getBilling(tenantId: string) {
  return get('/admin/billing', { tenantId })
}

export function getLedger(tenantId: string, cursor?: number | null, limit = 50) {
  const params: any = { tenantId, limit }
  if (cursor != null) params.cursor = cursor
  return get('/admin/billing/ledger', params)
}

export function creditTokens(payload: { tenantId: string; amount: number; reason: string }) {
  return post('/admin/billing/tokens/credit', payload)
}

export function debitTokens(payload: { tenantId: string; amount: number; reason: string }) {
  return post('/admin/billing/tokens/debit', payload)
}

export function resetPeriod(payload: { tenantId: string; reason?: string }) {
  return post('/admin/billing/period/reset', payload)
}
