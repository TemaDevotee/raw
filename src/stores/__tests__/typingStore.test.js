import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.useFakeTimers()
let typingStore, typingText, langStore
beforeAll(async () => {
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
  typingText = (await import('@/utils/typing.js')).typingText
  langStore = (await import('@/stores/langStore.js')).default
  typingStore = (await import('@/stores/typingStore.js')).typingStore
})

describe('typingStore', () => {
  it('expires typing entries after TTL', () => {
    typingStore.startTyping('1', 'a')
    expect(typingStore.getTyping('1')).toContain('a')
    vi.advanceTimersByTime(3000)
    vi.runOnlyPendingTimers()
    expect(typingStore.getTyping('1')).not.toContain('a')
  })

  it('tracks agent drafting flag', () => {
    typingStore.setAgentDrafting('1', true)
    expect(typingStore.isAgentDrafting('1')).toBe(true)
    typingStore.setAgentDrafting('1', false)
    expect(typingStore.isAgentDrafting('1')).toBe(false)
  })

  it('summarizes typing text', () => {
    expect(typingText(['Ann'])).toBe(langStore.t('someoneTyping', { name: 'Ann' }))
    expect(typingText(['A', 'B'])).toBe(langStore.t('severalTyping'))
  })
})

