import { describe, it, expect, vi } from 'vitest'
vi.mock('@/api/drafts', () => ({
  listDrafts: vi.fn().mockResolvedValue({ data: [] }),
  approveDraft: vi.fn().mockResolvedValue({ chatId: '1', message: { sender: 'agent', text: 'hi', time: 'now' } }),
  discardDraft: vi.fn().mockResolvedValue({ ok: true }),
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

import draftStore from '../draftStore.js'

describe('draftStore', () => {
  it('counts drafts by chat', () => {
    draftStore.state.draftsByChat['1'] = [
      { id: 'd1', chatId: '1', text: 'hi', state: 'queued' },
    ]
    expect(draftStore.count('1')).toBe(1)
    expect(draftStore.listByChat('1').length).toBe(1)
  })

  it('captures agent replies toggle', () => {
    draftStore.captureAgentReplies('1', true)
    expect(draftStore.state.capture.has('1')).toBe(true)
    draftStore.captureAgentReplies('1', false)
    expect(draftStore.state.capture.has('1')).toBe(false)
  })

  it('removes draft on approve and restores on error', async () => {
    draftStore.state.draftsByChat['2'] = [
      { id: 'd1', chatId: '2', text: 'hi', state: 'queued' },
    ]
    const api = await import('@/api/drafts')
    api.approveDraft.mockRejectedValueOnce(new Error('fail'))
    await expect(draftStore.approve('2', 'd1')).rejects.toThrow()
    expect(draftStore.listByChat('2').length).toBe(1)
    api.approveDraft.mockResolvedValueOnce({ data: { chatId: '2' } })
    await draftStore.approve('2', 'd1')
    expect(draftStore.listByChat('2').length).toBe(0)
  })
})
