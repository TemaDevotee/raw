import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: null }) },
}))

let agentStore

beforeEach(async () => {
  global.localStorage = {
    store: {},
    getItem(key) {
      return this.store[key] || null
    },
    setItem(key, value) {
      this.store[key] = value
    },
    removeItem(key) {
      delete this.store[key]
    },
  }
  agentStore = (await import('../agentStore.js')).agentStore
  agentStore.setKnowledgeLinks([])
  agentStore.setManualApprove(false)
})

describe('agentStore knowledge links', () => {
  it('adds collection with defaults', () => {
    const link = agentStore.addKnowledgeLink('c1')
    expect(link.params.topK).toBe(5)
    expect(link.params.chunkSize).toBe(500)
    expect(agentStore.state.knowledgeLinks.length).toBe(1)
    expect(agentStore.state.knowledgeLinks[0].collectionId).toBe('c1')
  })

  it('reorders links updates priority', () => {
    const a = agentStore.addKnowledgeLink('a')
    const b = agentStore.addKnowledgeLink('b')
    agentStore.reorderKnowledgeLinks([b, a])
    expect(agentStore.state.knowledgeLinks[0].collectionId).toBe('b')
    expect(agentStore.state.knowledgeLinks[0].params.priority).toBe(0)
  })

  it('effectiveKnowledge filters and sorts', () => {
    agentStore.addKnowledgeLink('a')
    agentStore.addKnowledgeLink('b')
    agentStore.state.knowledgeLinks[1].enabled = false
    const result = agentStore.effectiveKnowledge()
    expect(result.length).toBe(1)
    expect(result[0].collectionId).toBe('a')
  })

  it('hydrate restores persisted data', async () => {
    agentStore.setKnowledgeLinks([
      { collectionId: 'x', enabled: true, params: { topK: 5, maxChunks: 500, citations: false, priority: 0 } },
    ])
    const raw = JSON.stringify({
      manualApprove: false,
      knowledgeLinks: agentStore.state.knowledgeLinks,
    })
    global.localStorage.store['agent.settings.v1'] = raw
    agentStore.state.knowledgeLinks = []
    agentStore.hydrate()
    expect(agentStore.state.knowledgeLinks.length).toBe(1)
    expect(agentStore.state.knowledgeLinks[0].collectionId).toBe('x')
  })

  it('getById returns undefined for unknown id', async () => {
    const res = await agentStore.getById('999')
    expect(res).toBeUndefined()
  })
})
