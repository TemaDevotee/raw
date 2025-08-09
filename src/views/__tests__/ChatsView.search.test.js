import { describe, it, expect } from 'vitest'
import { filterChatsList } from '../chatsUtils.js'

describe('ChatsView search', () => {
  const agents = {
    a1: { id: 'a1', name: 'Orion' },
    a2: { id: 'a2', name: 'Helix' },
  }
  const chats = [
    { id: 1, clientName: 'Foo', lastMessage: '', status: 'live', agentId: 'a1' },
    { id: 2, clientName: 'Bar', lastMessage: '', status: 'live', agentId: 'a2' },
  ]
  it('filters by agent name', () => {
    const res = filterChatsList(chats, '', 'orion', agents)
    expect(res).toHaveLength(1)
    expect(res[0].agentId).toBe('a1')
  })
  it('matches partial agent name', () => {
    const res = filterChatsList(chats, '', 'hel', agents)
    expect(res).toHaveLength(1)
    expect(res[0].agentId).toBe('a2')
  })
})
