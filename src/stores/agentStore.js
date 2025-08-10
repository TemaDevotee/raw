import { reactive } from 'vue'
import apiClient from '@/api'

const STORAGE_KEY = 'agent.settings.v1'

const state = reactive({
  manualApprove: false,
  autoReturnMinutes: 0,
  knowledgeLinks: [],
  agentsById: {},
})

function hydrate() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      state.manualApprove = !!parsed.manualApprove
      state.autoReturnMinutes = Number(parsed.autoReturnMinutes) || 0
      state.knowledgeLinks = Array.isArray(parsed.knowledgeLinks)
        ? parsed.knowledgeLinks
        : []
    } catch {
      state.manualApprove = false
      state.autoReturnMinutes = 0
      state.knowledgeLinks = []
    }
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      manualApprove: state.manualApprove,
      autoReturnMinutes: state.autoReturnMinutes,
      knowledgeLinks: state.knowledgeLinks,
    }),
  )
}

function setManualApprove(val) {
  state.manualApprove = !!val
  persist()
}

function setAutoReturnMinutes(val) {
  state.autoReturnMinutes = Number(val) || 0
  persist()
}

function setKnowledgeLinks(links) {
  state.knowledgeLinks = links
  persist()
}

function addKnowledgeLink(collectionId) {
  const link = {
    collectionId,
    enabled: true,
    params: {
      topK: 5,
      maxChunks: 500,
      citations: false,
      chunkSize: 500,
      chunkOverlap: 50,
      embeddingModel: 'text-embedding-3-small',
      rerankModel: '',
      temperature: 0,
      maxContextTokens: 4000,
      priority: state.knowledgeLinks.length,
    },
  }
  state.knowledgeLinks.push(link)
  persist()
  return link
}

function updateKnowledgeLink(index, patch) {
  const existing = state.knowledgeLinks[index]
  if (!existing) return
  state.knowledgeLinks[index] = { ...existing, ...patch }
  persist()
}

function removeKnowledgeLink(index) {
  state.knowledgeLinks.splice(index, 1)
  state.knowledgeLinks.forEach((l, i) => (l.params.priority = i))
  persist()
}

function reorderKnowledgeLinks(newOrder) {
  state.knowledgeLinks = newOrder.map((l, i) => ({
    ...l,
    params: { ...l.params, priority: i },
  }))
  persist()
}

function effectiveKnowledge() {
  return state.knowledgeLinks
    .filter((l) => l.enabled)
    .sort((a, b) => (a.params.priority ?? 0) - (b.params.priority ?? 0))
}

async function fetchAgents() {
  try {
    const res = await apiClient.get('/agents')
    state.agentsById = {}
    ;(res.data || []).forEach((a) => {
      state.agentsById[a.id] = a
    })
  } catch {
    state.agentsById = {}
  }
}

async function getById(id) {
  const cached = state.agentsById[id]
  if (cached) return cached
  try {
    const res = await apiClient.get(`/agents/${id}`)
    const agent = res.data
    if (agent && agent.id) {
      state.agentsById[agent.id] = agent
      return agent
    }
    return undefined
  } catch {
    return undefined
  }
}

function agentById(id) {
  return state.agentsById[id]
}

hydrate()

export const agentStore = {
  state,
  hydrate,
  persist,
  setManualApprove,
  setAutoReturnMinutes,
  setKnowledgeLinks,
  addKnowledgeLink,
  updateKnowledgeLink,
  removeKnowledgeLink,
  reorderKnowledgeLinks,
  effectiveKnowledge,
  fetchAgents,
  getById,
  agentById,
}
