global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

import { describe, it, expect } from 'vitest'

describe('KnowledgeView component', () => {
  it('loads component', async () => {
    const mod = await import('@/views/KnowledgeView.vue')
    expect(mod.default).toBeTruthy()
  })
})
