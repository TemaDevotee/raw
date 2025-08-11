import langStore from '@/stores/langStore.js'

export { statusColor, statusGradient, badgeColor } from '@/utils/statusTheme.js'

export function chatTimestamp(chat) {
  const t = chat.timestamp ?? chat.updatedAt ?? chat.time
  if (typeof t === 'number') return t
  if (!t) return 0
  const norm = String(t).trim().toLowerCase()
  if (norm === 'now' || norm === 'just now') return Date.now()
  const m = norm.match(/^(\d+)(m|h|d)/)
  if (m) {
    const n = Number(m[1])
    const unit = m[2]
    if (unit === 'm') return Date.now() - n * 60_000
    if (unit === 'h') return Date.now() - n * 3_600_000
    if (unit === 'd') return Date.now() - n * 86_400_000
  }
  const parsed = Date.parse(t)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function groupAndSort(chats) {
  const groups = { live: [], attention: [], paused: [], resolved: [], idle: [] }
  chats.forEach((chat) => {
    const key = chat.status === 'ended' ? 'idle' : chat.status
    if (!groups[key]) groups[key] = []
    groups[key].push(chat)
  })
  Object.keys(groups).forEach((k) => {
    groups[k].sort((a, b) => chatTimestamp(b) - chatTimestamp(a))
  })
  return groups
}

export function filterChatsList(chats, status = '', query = '', agentsById = {}) {
  const q = query.trim().toLowerCase()
  return chats.filter((c) => {
    const agentName = agentsById[c.agentId]?.name?.toLowerCase() || ''
    const matchSearch =
      !q ||
      c.clientName.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q) ||
      String(c.id).toLowerCase().includes(q) ||
      agentName.includes(q)
    const matchStatus = !status || c.status === status
    return matchSearch && matchStatus
  })
}

export const GROUPS_KEY = 'chats.groups.v1'

export function statusLabel(status) {
  const dict = langStore.messages[langStore.current]?.status || {}
  return dict[status] || langStore.messages.en.status?.[status] || status
}

export function toggleGroupState(openGroups, status, storage = globalThis.sessionStorage) {
  openGroups[status] = openGroups[status] !== false ? false : true
  try {
    storage.setItem(GROUPS_KEY, JSON.stringify(openGroups))
  } catch {
    /* ignore */
  }
  return openGroups
}

export function restoreGroupState(storage = globalThis.sessionStorage) {
  try {
    const saved = storage.getItem(GROUPS_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export async function updateChatStatus(chat, status, api, toast, t) {
  if (!chat || chat.status === status) return
  const prev = chat.status
  chat.status = status
  try {
    await api.post(`/chats/${chat.id}/status`, { status })
  } catch {
    chat.status = prev
    toast(t('statusChangeFailed') || 'Status update failed', 'error')
  }
}

