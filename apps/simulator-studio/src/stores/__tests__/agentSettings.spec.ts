import { describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentSettingsStore } from '../agentSettings'

// simple mock for admin API
vi.mock('../../api/admin', () => ({
  getAgentSettings: vi.fn(() => Promise.resolve({ settings: { provider: 'mock', systemPrompt: 'hi', temperature: 0.3, maxTokens: 10 }, availableProviders: ['mock'] })),
  saveAgentSettings: vi.fn(() => Promise.resolve({ settings: { provider: 'mock', systemPrompt: 'hi', temperature: 0.3, maxTokens: 10 } }))
}))

describe('agentSettings store', () => {
  it('loads settings', async () => {
    setActivePinia(createPinia())
    const s = useAgentSettingsStore()
    await s.load('c1')
    expect(s.byChat['c1'].systemPrompt).toBe('hi')
  })
})
