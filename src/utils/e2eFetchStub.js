import { isE2E } from '@/utils/e2e'

export function installE2EStubs() {
  if (!isE2E || typeof window === 'undefined' || !window.fetch) return

  const original = window.fetch.bind(window)
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url
    const apiBase = window.__E2E_API_BASE__ || ''
    const toApi = (path) => `${apiBase}${path}`
    
    if (/\/chats\/?(\?.*)?$/.test(url)) {
      return json([
        {
          id: 1,
          clientName: 'Acme Inc',
          lastMessage: 'Hello',
          time: '1m ago',
          status: 'attention',
          channels: ['web'],
          agentId: 1,
        },
        {
          id: 2,
          clientName: 'Globex',
          lastMessage: 'Hi',
          time: '2m ago',
          status: 'live',
          channels: ['web'],
          agentId: 2,
        },
      ])
    }

    const matchDrafts = url.match(/\/chats\/([^/]+)\/drafts(?:\?|$)/)
    if (matchDrafts) {
      const drafts = (window.__e2eDraftsData || {})[matchDrafts[1]] || []
      return json(drafts)
    }

    const path = new URL(url, apiBase || window.location.origin).pathname

    const approveMatch = path.match(/\/api\/chats\/([^/]+)\/drafts\/([^/]+)\/approve\/?$/)
    if (approveMatch && init?.method === 'POST') {
      const [, chatId, draftId] = approveMatch
      const res = await original(toApi(`/api/chats/${chatId}/drafts/${draftId}/approve`), init)
      if (res.ok) {
        const store = window.__e2eDraftsData || {}
        const arr = store[chatId] || []
        const idx = arr.findIndex((d) => String(d.id) === String(draftId))
        if (idx !== -1) arr.splice(idx, 1)
        store[chatId] = arr
        window.__e2eDraftsData = store
      }
      return res
    }

    const discardPostMatch = path.match(/\/api\/chats\/([^/]+)\/drafts\/([^/]+)\/discard\/?$/)
    if (discardPostMatch && init?.method === 'POST') {
      const [, chatId, draftId] = discardPostMatch
      const res = await original(toApi(`/api/chats/${chatId}/drafts/${draftId}/discard`), init)
      if (res.ok) {
        const store = window.__e2eDraftsData || {}
        const arr = store[chatId] || []
        const idx = arr.findIndex((d) => String(d.id) === String(draftId))
        if (idx !== -1) arr.splice(idx, 1)
        store[chatId] = arr
        window.__e2eDraftsData = store
      }
      return res
    }

    const discardDelMatch = path.match(/\/api\/chats\/([^/]+)\/drafts\/([^/]+)\/?$/)
    if (discardDelMatch && init?.method === 'DELETE') {
      const [, chatId, draftId] = discardDelMatch
      const res = await original(toApi(`/api/chats/${chatId}/drafts/${draftId}`), init)
      if (res.ok) {
        const store = window.__e2eDraftsData || {}
        const arr = store[chatId] || []
        const idx = arr.findIndex((d) => String(d.id) === String(draftId))
        if (idx !== -1) arr.splice(idx, 1)
        store[chatId] = arr
        window.__e2eDraftsData = store
      }
      return res
    }

    const matchChat = url.match(/\/chats\/([^/?]+)(?:\?|$)/)
    if (matchChat) {
      const chats = window.__e2eChatsData || {}
      const chat = chats[matchChat[1]] || { id: matchChat[1], messages: [], status: 'live' }
      return json(chat)
    }

    if (url.includes('/agents')) {
      const match = url.match(/\/agents\/([^/?]+)(?:\?|$)/)
      const data = window.__e2eAgentsData || []
      if (match) {
        const agent = data.find((a) => String(a.id) === match[1])
        return json(agent || {})
      }
      return json(data)
    }

    if (url.includes('/knowledge/collections')) {
      const list = window.__e2eKnowledgeCollections || []
      if (init?.method === 'POST') {
        const body = init.body ? JSON.parse(init.body) : {}
        const coll = {
          id: Date.now().toString(),
          name: body.name || '',
          createdAt: new Date().toISOString(),
         sourcesCount: 0,
        }
        list.push(coll)
        window.__e2eKnowledgeCollections = list
        return json(coll, 201)
      }
      return json(list)
    }

    if (url.includes('/presence/list')) {
      const body = init && typeof init.body === 'string' ? JSON.parse(init.body) : {}
      const ids = body.chatIds || []
      const map = window.__e2ePresenceData || {}
      const list = ids.map((id) => ({
        chatId: String(id),
        participants: map[String(id)] || [],
        updatedAt: new Date().toISOString(),
      }))
      return json(list)
    }
    if (url.match(/\/presence\/(join|leave)/)) {
      return json({ ok: true })
    }

    if (url.includes('/account/usage')) {
      return json({
        plan: 'Pro',
        periodStart: '2025-08-01T00:00:00Z',
        periodEnd: '2025-09-01T00:00:00Z',
        includedMonthlyTokens: 50000,
        usedThisPeriod: 0,
        topupBalance: 0,
        remainingInPeriod: 50000,
        totalRemaining: 50000,
      })
    }

    if (url.includes('/account/billing')) {
      return json({
        plan: 'Pro',
        tokenQuota: 200000,
        tokenUsed: 34850,
        period: { start: '2025-08-01', end: '2025-09-01' },
      })
    }

    return original(input, init)
  }
}
