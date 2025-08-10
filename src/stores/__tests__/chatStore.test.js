import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/stores/toastStore', () => ({ showToast: vi.fn() }))
vi.mock('@/api/drafts', () => ({
  fetchDrafts: vi.fn().mockResolvedValue({ data: [{ id: 'd1', body: 'hi' }] }),
  approveDraft: vi.fn().mockResolvedValue({}),
  rejectDraft: vi.fn().mockResolvedValue({}),
  editAndSend: vi.fn().mockResolvedValue({}),
  sendAll: vi.fn().mockResolvedValue({}),
  rejectAll: vi.fn().mockResolvedValue({}),
}))

function mockStorage() {
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

let chatStore

beforeEach(async () => {
  chatStore = (await import('../chatStore.js')).chatStore
  chatStore.state.drafts = {}
  chatStore.state.isLoadingDrafts = false
  chatStore.state.isBulkSubmitting = false
})

describe('chatStore', () => {
  it('fetchDrafts stores data', async () => {
    await chatStore.fetchDrafts('1')
    expect(chatStore.state.drafts['1']).toHaveLength(1)
  })

  it('approveDraft removes draft', async () => {
    chatStore.state.drafts['1'] = [{ id: 'a', body: 't' }]
    await chatStore.approveDraft('1', 'a')
    expect(chatStore.state.drafts['1']).toHaveLength(0)
  })

  it('rejectDraft removes draft', async () => {
    chatStore.state.drafts['1'] = [{ id: 'a', body: 't' }]
    await chatStore.rejectDraft('1', 'a')
    expect(chatStore.state.drafts['1']).toHaveLength(0)
  })

  it('editAndSend removes draft', async () => {
    chatStore.state.drafts['1'] = [{ id: 'a', body: 't' }]
    await chatStore.editAndSend('1', 'a', 'x')
    expect(chatStore.state.drafts['1']).toHaveLength(0)
  })

  it('sendAll clears drafts', async () => {
    chatStore.state.drafts['1'] = [{ id: 'a' }, { id: 'b' }]
    await chatStore.sendAll('1')
    expect(chatStore.state.drafts['1']).toHaveLength(0)
    expect(chatStore.state.isBulkSubmitting).toBe(false)
  })

  it('rejectAll clears drafts', async () => {
    chatStore.state.drafts['1'] = [{ id: 'a' }]
    await chatStore.rejectAll('1')
    expect(chatStore.state.drafts['1']).toHaveLength(0)
    expect(chatStore.state.isBulkSubmitting).toBe(false)
  })
})
