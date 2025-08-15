import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

describe('auth store', () => {
  setActivePinia(createPinia())
  const store = useAuthStore()
  it('can checks roles', () => {
    store.user = { role: 'viewer' }
    expect(store.can(['viewer'])).toBe(true)
    expect(store.can(['owner'])).toBe(false)
  })
})
