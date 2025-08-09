import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/stores/agentStore.js', () => {
  const state = { knowledgeLinks: [] }
  return {
    agentStore: {
      state,
      setKnowledgeLinks: vi.fn((links) => (state.knowledgeLinks = links)),
    },
  }
})
vi.mock('@/stores/knowledgeStore.js', () => ({
  knowledgeStore: {
    state: {
      collections: [
        { id: 'c1', name: 'Docs' },
        { id: 'c2', name: 'FAQ' },
      ],
    },
  },
}))
vi.mock('@/stores/toastStore', () => ({ showToast: vi.fn() }))
vi.mock('@/stores/langStore', () => ({ default: { t: (k) => k } }))
vi.mock('@/api/agents.js', () => ({ patchKnowledge: vi.fn(() => Promise.resolve({})) }))

import { useAgentKnowledge } from '../agentKnowledgeLogic.js'
import { agentStore } from '@/stores/agentStore.js'
import { patchKnowledge } from '@/api/agents.js'

describe('useAgentKnowledge', () => {
  beforeEach(() => {
    agentStore.state.knowledgeLinks = []
  })

  it('adds collection with defaults and saves', async () => {
    const logic = useAgentKnowledge('a1')
    logic.selectedId.value = 'c1'
    logic.addSelected()
    expect(logic.links.value.length).toBe(1)
    await logic.save()
    expect(patchKnowledge).toHaveBeenCalled()
  })

  it('rolls back on save error', async () => {
    patchKnowledge.mockRejectedValueOnce(new Error('fail'))
    agentStore.state.knowledgeLinks = []
    const logic = useAgentKnowledge('a1')
    logic.selectedId.value = 'c1'
    logic.addSelected()
    await logic.save()
    expect(logic.links.value.length).toBe(0)
  })
})
