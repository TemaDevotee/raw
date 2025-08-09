import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { composerStore } from '@/stores/composerStore.js'

beforeAll(() => {
  global.localStorage = {
    store: {},
    getItem(key) {
      return this.store[key] || null
    },
    setItem(key, val) {
      this.store[key] = String(val)
    },
    removeItem(key) {
      delete this.store[key]
    },
    clear() {
      this.store = {}
    },
  }
})

beforeEach(() => {
  localStorage.clear()
  Object.keys(composerStore.state.drafts).forEach((k) => delete composerStore.state.drafts[k])
})

describe('composerStore', () => {
  it('saves and restores drafts', () => {
    composerStore.save('1', 'hi')
    const draft = composerStore.get('1')
    expect(draft.body).toBe('hi')
    composerStore.remove('1')
    expect(composerStore.get('1')).toBeNull()
  })
})

