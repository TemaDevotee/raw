import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/presence', () => ({
  listPresence: vi.fn(),
  joinChat: vi.fn(),
  leaveChat: vi.fn(),
}))

import { presenceStore } from '../presenceStore.js'
import * as api from '@/api/presence'

describe('presenceStore', () => {
  beforeEach(() => {
    presenceStore.state.byChatId = {}
    vi.clearAllMocks()
  })

  it('hydrates from api', async () => {
    api.listPresence.mockResolvedValue([
      { chatId: '1', participants: [{ id: 'u1', name: 'A', role: 'operator', online: true }], updatedAt: 'now' },
    ])
    await presenceStore.hydrate(['1'])
    expect(presenceStore.getParticipants('1').length).toBe(1)
  })

  it('join and leave update store', async () => {
    api.joinChat.mockResolvedValue({ chatId: '1', participants: [{ id: 'me' }], updatedAt: 'now' })
    await presenceStore.join('1', { id: 'me' })
    expect(presenceStore.count('1')).toBe(1)
    api.leaveChat.mockResolvedValue({ chatId: '1', participants: [], updatedAt: 'now' })
    await presenceStore.leave('1', { id: 'me' })
    expect(presenceStore.count('1')).toBe(0)
  })
})
