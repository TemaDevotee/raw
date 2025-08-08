export const STATUS_COLORS = {
  attention: '#EF4444',
  live: '#22C55E',
  paused: '#F59E0B',
  resolved: '#84CC16',
  idle: '#9CA3AF',
}

export const STATUS_GRADIENTS = {
  attention: 'linear-gradient(to right, #FB923C, #EF4444)',
  live: 'linear-gradient(to right, #34D399, #22C55E)',
  paused: 'linear-gradient(to right, #FBBF24, #F59E0B)',
  resolved: 'linear-gradient(to right, #A3E635, #84CC16)',
  ended: 'linear-gradient(to right, #F87171, #EF4444)',
  idle: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
}

export function statusColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.idle
}

export function statusGradient(status) {
  return STATUS_GRADIENTS[status] || STATUS_GRADIENTS.idle
}

export function badgeColor(status) {
  return `${statusColor(status)}33`
}

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

export function filterChatsList(chats, status = '', query = '') {
  const q = query.trim().toLowerCase()
  return chats.filter((c) => {
    const matchSearch =
      !q ||
      c.clientName.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    const matchStatus = !status || c.status === status
    return matchSearch && matchStatus
  })
}

export const GROUPS_KEY = 'chats.groups.v1'

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

export function presenceCount(map, id) {
  const arr = map[String(id)] || []
  return arr.length
}

