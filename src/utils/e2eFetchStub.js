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

    if (url.match(/\/presence\/(join|leave)/)) {
      return original(input, init)
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
