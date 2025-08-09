import { describe, it, expect } from 'vitest'

describe('AgentDetailView component', () => {
  it('loads component', async () => {
    global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    const mod = await import('@/views/AgentDetailView.vue')
    expect(mod.default).toBeTruthy()
  })
})
