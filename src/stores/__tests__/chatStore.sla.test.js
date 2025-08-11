import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.useFakeTimers()

vi.mock('@/stores/toastStore', () => ({ showToast: vi.fn() }))
vi.mock('@/api/chats', () => ({
  snooze: vi.fn(),
  unsnooze: vi.fn(),
}))

let chatStore, toast
beforeEach(async () => {
  vi.clearAllTimers()
  vi.setSystemTime(0)
  vi.resetModules()
  const mockStorage = () => {
    let store = {}
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v)
      },
      removeItem: (k) => {
        delete store[k]
      },
      clear: () => {
        store = {}
      },
    }
  }
  global.localStorage = mockStorage()
  chatStore = (await import('../chatStore.js')).chatStore
  toast = (await import('@/stores/toastStore')).showToast
  toast.mockReset()
  chatStore.state.chats = []
})

describe('chatStore SLA', () => {
  it('initialises SLA when entering attention', () => {
    const chat = { id: '1', status: 'attention' }
    chatStore.mergePersisted([chat])
    chatStore.handleStatusChange(chat)
    expect(chat.slaStartedAt).toBeTruthy()
    expect(chat.slaBreached).toBe(false)
  })

  it('getSlaRemainingMs computes correctly', () => {
    const chat = { id: '1', status: 'attention', slaStartedAt: new Date(0).toISOString() }
    expect(chatStore.getSlaRemainingMs(chat, 5)).toBe(5 * 60_000)
    vi.setSystemTime(60_000)
    expect(chatStore.getSlaRemainingMs(chat, 5)).toBe(4 * 60_000)
  })

  it('breaches after timer elapses once', async () => {
    const chat = { id: '1', status: 'attention' }
    chatStore.mergePersisted([chat])
    chatStore.handleStatusChange(chat)
    vi.advanceTimersByTime(5 * 60_000 + 500)
    expect(chat.slaBreached).toBe(true)
    expect(toast).toHaveBeenCalledTimes(1)
  })

  it('paused keeps start but is inactive', () => {
    const chat = { id: '1', status: 'attention' }
    chatStore.mergePersisted([chat])
    chatStore.handleStatusChange(chat)
    const started = chat.slaStartedAt
    chat.status = 'paused'
    chatStore.handleStatusChange(chat, 'attention')
    expect(chat.slaStartedAt).toBe(started)
    expect(chatStore.isSlaActive(chat)).toBe(false)
  })

  it.skip('persists and hydrates SLA data', async () => {})
})
