import apiClient from '.'

export function listDrafts(chatId) {
  return apiClient.get(`/chats/${chatId}/drafts`)
}

export function approveDraft(chatId, id) {
  return apiClient.post(`/chats/${chatId}/drafts/${id}/approve`)
}

export function discardDraft(chatId, id) {
  return apiClient.post(`/chats/${chatId}/drafts/${id}/discard`)
}
