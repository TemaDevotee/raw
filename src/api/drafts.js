import apiClient from '.'

export function listDrafts(chatId) {
  return apiClient.get(`/drafts/list/${chatId}`)
}

export function approveDraft(id) {
  return apiClient.post(`/drafts/approve/${id}`)
}

export function discardDraft(id) {
  return apiClient.post(`/drafts/discard/${id}`)
}
