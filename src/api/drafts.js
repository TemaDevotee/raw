import apiClient from '.'

export function fetchDrafts(chatId) {
  return apiClient.get(`/chats/${chatId}/drafts`)
}

export function approveDraft(chatId, draftId) {
  return apiClient.post(`/chats/${chatId}/drafts/${draftId}/approve`)
}

export function rejectDraft(chatId, draftId) {
  return apiClient.delete(`/chats/${chatId}/drafts/${draftId}`)
}

export function editAndSend(chatId, draftId, body) {
  return apiClient.post(`/chats/${chatId}/drafts/${draftId}/send`, { body })
}

export function sendAll(chatId) {
  return apiClient.post(`/chats/${chatId}/drafts/approve_all`)
}

export function rejectAll(chatId) {
  return apiClient.delete(`/chats/${chatId}/drafts`, { params: { all: true } })
}
