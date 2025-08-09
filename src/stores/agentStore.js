import { reactive } from 'vue'

const STORAGE_KEY = 'agent.settings.v1'

const state = reactive({
  manualApprove: false,
  knowledgeLinks: [],
})

function hydrate() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      state.manualApprove = !!parsed.manualApprove
      state.knowledgeLinks = Array.isArray(parsed.knowledgeLinks)
        ? parsed.knowledgeLinks
        : []
    } catch {
      state.manualApprove = false
      state.knowledgeLinks = []
    }
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      manualApprove: state.manualApprove,
      knowledgeLinks: state.knowledgeLinks,
    }),
  )
}

function setManualApprove(val) {
  state.manualApprove = !!val
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
    params: { topK: 5, maxChunks: 500, citations: false, priority: state.knowledgeLinks.length },
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

hydrate()

export const agentStore = {
  state,
  hydrate,
  persist,
  setManualApprove,
  setKnowledgeLinks,
  addKnowledgeLink,
  updateKnowledgeLink,
  removeKnowledgeLink,
  reorderKnowledgeLinks,
  effectiveKnowledge,
}
