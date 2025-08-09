import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  statusColor,
  badgeColor,
  statusGradient,
  groupAndSort,
  filterChatsList,
  toggleGroupState,
  restoreGroupState,
  presenceCount,
  computePresenceDisplay,
  updateChatStatus,
  GROUPS_KEY,
} from '../chatsUtils.js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

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

describe('chats utils', () => {
  beforeEach(() => {
    global.sessionStorage = mockStorage()
  })

  it('maps status to colors and badge colors', () => {
    expect(statusColor('live')).toBe('#22C55E')
    expect(statusColor('unknown')).toBe('#9CA3AF')
    expect(badgeColor('attention')).toBe('#EF444433')
  })

  it('maps status to gradients', () => {
    expect(statusGradient('attention')).toMatch('#FB923C')
    expect(statusGradient('ended')).toMatch('#F87171')
    expect(statusGradient('unknown')).toMatch('#e5e7eb')
  })

  it('groups and sorts chats by activity', () => {
    const chats = [
      { id: 1, status: 'live', time: 1000 },
      { id: 2, status: 'live', time: 2000 },
      { id: 3, status: 'paused', time: 1500 },
    ]
    const groups = groupAndSort(chats)
    expect(groups.live.map((c) => c.id)).toEqual([2, 1])
    expect(groups.paused[0].id).toBe(3)
  })

  it('filters by status and search', () => {
    const chats = [
      { clientName: 'Alice', lastMessage: 'hello', status: 'live' },
      { clientName: 'Bob', lastMessage: 'Alice', status: 'paused' },
      { clientName: 'Allan', lastMessage: 'x', status: 'live' },
    ]
    const res = filterChatsList(chats, 'live', 'ali')
    expect(res).toHaveLength(1)
    expect(res[0].clientName).toBe('Alice')
  })

  it('toggles and restores group state', () => {
    const open = {}
    toggleGroupState(open, 'live')
    expect(open.live).toBe(false)
    toggleGroupState(open, 'live')
    expect(open.live).toBe(true)
    const saved = sessionStorage.getItem(GROUPS_KEY)
    expect(JSON.parse(saved)).toEqual({ live: true })
    const restored = restoreGroupState()
    expect(restored).toEqual({ live: true })
  })

  it('counts presence correctly', () => {
    const map = { '1': [1, 2], '2': [] }
    expect(presenceCount(map, 1)).toBe(2)
    expect(presenceCount(map, 2)).toBe(0)
  })

  it('computes presence display with extras and ordering', () => {
    const list = [
      { userId: 1, name: 'Alice' },
      { userId: 2, name: 'Bob' },
      { userId: 3, name: 'Cara' },
      { userId: 4, name: 'Dan' },
      { userId: 2, name: 'Bob' },
    ]
    const { visible, extra } = computePresenceDisplay(list, 2)
    expect(visible.map((p) => p.userId)).toEqual([2, 1, 3])
    expect(extra).toBe(1)
  })

  it('optimistically updates status and rolls back on failure', async () => {
    const chat = { id: 5, status: 'live' }
    const api = { post: vi.fn().mockRejectedValue(new Error('fail')) }
    const toast = vi.fn()
    await updateChatStatus(chat, 'paused', api, toast, (k) => k)
    expect(chat.status).toBe('live')
    expect(toast).toHaveBeenCalled()
    api.post.mockResolvedValue({})
    await updateChatStatus(chat, 'paused', api, toast, (k) => k)
    expect(chat.status).toBe('paused')
  })

  it('template contains accessibility hooks', () => {
    const src = readFileSync(resolve('src/views/ChatsView.vue'), 'utf8')
    expect(src).toMatch(/role="button"/)
    expect(src).toMatch(/aria-label="statusAria/)
  })

  it('chat window template exposes menu and presence roles', () => {
    const src = readFileSync(resolve('src/views/ChatWindow.vue'), 'utf8')
    expect(src).toMatch(/role="menu"/)
    expect(src).toMatch(/data-testid="presence-stack"/)
  })
})

