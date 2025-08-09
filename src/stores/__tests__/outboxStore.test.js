import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

let outboxStore, apiClient

vi.mock('@/api', () => ({
  default: { post: vi.fn() }
}))

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
  global.navigator = { onLine: true }
  const listeners = {}
  global.window = {
    addEventListener(event, cb) {
      listeners[event] = cb
    },
    dispatchEvent(ev) {
      const fn = listeners[ev.type]
      if (fn) fn(ev)
    },
  }
  apiClient = (await import('@/api')).default
  outboxStore = (await import('@/stores/outboxStore.js')).outboxStore
})

beforeEach(() => {
  outboxStore.state.queue.length = 0
  localStorage.clear()
})

describe('outboxStore', () => {
  it('queues when network fails and flushes on online', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('offline'))
    const msg = outboxStore.enqueue('1', 'hello')
    await new Promise((r) => setTimeout(r, 0))
    expect(msg.status).toBe('pending')
    apiClient.post.mockResolvedValueOnce({})
    window.dispatchEvent(new Event('online'))
    await new Promise((r) => setTimeout(r, 0))
    expect(msg.status).toBe('sent')
  })

  it('marks failed on 4xx error', async () => {
    apiClient.post.mockRejectedValue({ response: { status: 400 } })
    const msg = outboxStore.enqueue('1', 'oops')
    await new Promise((r) => setTimeout(r, 0))
    expect(msg.status).toBe('failed')
  })
})

