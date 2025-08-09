import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/stores/toastStore', () => ({ showToast: vi.fn() }))

const assignChat = vi.fn(() => Promise.resolve())
const unassignChat = vi.fn(() => Promise.resolve())
const transferChat = vi.fn(() => Promise.resolve())

vi.mock('@/api/chats', () => ({
  assignChat,
  unassignChat,
  transferChat,
}))

let chatStore
beforeEach(async () => {
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
  chatStore.state.chats = [{ id: '1', status: 'live' }]
})

describe('chatStore assignment', () => {
  it('claims chat optimistically and rolls back on error', async () => {
    const op = { id: 'op1', name: 'Me' }
    await chatStore.claim('1', op)
    expect(chatStore.state.chats[0].assignedTo).toEqual({ id: 'op1', name: 'Me', avatarUrl: undefined })
    expect(assignChat).toHaveBeenCalled()
    assignChat.mockRejectedValueOnce(new Error('fail'))
    await chatStore.claim('1', op)
    expect(chatStore.state.chats[0].assignedTo).toEqual({ id: 'op1', name: 'Me', avatarUrl: undefined })
  })

  it('unassign clears and calls API', async () => {
    chatStore.state.chats[0].assignedTo = { id: 'op1', name: 'Me' }
    await chatStore.unassign('1')
    expect(chatStore.state.chats[0].assignedTo).toBe(null)
    expect(unassignChat).toHaveBeenCalled()
  })

  it('transfer updates assignedTo', async () => {
    chatStore.state.chats[0].assignedTo = { id: 'op1', name: 'Me' }
    await chatStore.transfer('1', { id: 'op2', name: 'Bob' })
    expect(chatStore.state.chats[0].assignedTo).toEqual({ id: 'op2', name: 'Bob', avatarUrl: undefined })
    expect(transferChat).toHaveBeenCalled()
  })

  it('canInterfere false when assigned to someone else', () => {
    const chat = { assignedTo: { id: 'op2' } }
    expect(chatStore.canInterfere(chat, 'op1')).toBe(false)
  })
})
