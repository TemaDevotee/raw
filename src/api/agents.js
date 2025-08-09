import apiClient from '@/api'

export function patchKnowledge(agentId, payload) {
  return apiClient.patch(`/agents/${agentId}/knowledge`, payload)
}
