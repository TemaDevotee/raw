import { describe, it, expect, vi } from 'vitest'
import { useChatConsoleStore } from '../chatConsole'

vi.mock('../../api/admin', () => ({
  getChats: vi.fn(async () => ({ items: [{ id: 'c1', subject: 's' }] })),
  getChatTranscript: vi.fn(async () => [{ id: 'm1', role: 'user', text: 'hi', ts: 1 }]),
  getChatDrafts: vi.fn(async () => [{ id: 'd1', text: 'draft', createdAt: new Date(2).toISOString(), state: 'queued' }]),
  postMessage: vi.fn(),
  createDraft: vi.fn(),
  approveDraft: vi.fn(),
  discardDraft: vi.fn()
}))

describe('chatConsole store', () => {
  it('loads chat and combines timeline', async () => {
    const store = useChatConsoleStore()
    await store.loadChat('t1', 'c1')
    await store.loadTranscript('c1')
    await store.loadDrafts('c1')
    expect(store.chat.id).toBe('c1')
    expect(store.timeline.length).toBe(2)
  })
})
