import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.useFakeTimers()

vi.mock('@/stores/toastStore', () => ({ showToast: vi.fn() }))

const interfereChat = vi.fn(() => Promise.resolve())
const returnToAgent = vi.fn(() => Promise.resolve())

vi.mock('@/api/chats', () => ({
  interfereChat,
  returnToAgent,
}))

let chatStore, agentStore
beforeEach(async () => {
  vi.clearAllTimers()
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
  ;({ chatStore } = await import('../chatStore.js'))
  ;({ agentStore } = await import('../agentStore.js'))
  agentStore.state.autoReturnMinutes = 2
  chatStore.state.chats = [{ id: '1', status: 'live' }]
  interfereChat.mockReset()
  returnToAgent.mockReset()
})

describe('chatStore auto-return', () => {
  it('schedules warn and fire, cancel stops return', async () => {
    await chatStore.interfere('1', { id: 'me' })
    vi.advanceTimersByTime(60_000)
    expect(interfereChat).toHaveBeenCalled()
    chatStore.cancelAutoReturn('1')
    vi.advanceTimersByTime(120_000)
    expect(returnToAgent).not.toHaveBeenCalled()
  })

  it('activity reschedules timers and fires return', async () => {
    await chatStore.interfere('1', { id: 'me' })
    vi.advanceTimersByTime(30_000)
    chatStore.touchActivity('1')
    vi.advanceTimersByTime(90_000)
    expect(returnToAgent).not.toHaveBeenCalled()
    vi.advanceTimersByTime(60_000)
    expect(returnToAgent).toHaveBeenCalled()
  })
})
