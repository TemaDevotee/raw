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

  it('upserts messages and drafts', () => {
    const store = useChatConsoleStore()
    store.chat = { id: 'c1' }
    store.upsertMessage('c1', { id: 'm2', role: 'user', text: 'x', ts: 2 })
    expect(store.transcript.find(m => m.id === 'm2')).toBeTruthy()
    store.upsertDraft('c1', { id: 'd2', text: 'draft', createdAt: new Date().toISOString() })
    expect(store.drafts.find(d => d.id === 'd2')).toBeTruthy()
    store.removeDraft('c1', 'd2')
    expect(store.drafts.find(d => d.id === 'd2')).toBeFalsy()
  })
})
