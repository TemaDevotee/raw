import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentStore } from '../agent'

describe('agent store', () => {
  it('tracks state and typing', () => {
    setActivePinia(createPinia())
    const s = useAgentStore()
    s.setState('c1', 'typing')
    s.setTyping('c1', true)
    expect(s.byChat['c1'].state).toBe('typing')
    expect(s.byChat['c1'].typing).toBe(true)
  })
})
