module.exports = {
  tenants: [
    {
      id: 'acme',
      name: 'Acme Corp',
      billing: {
        plan: 'FREE',
        tokenQuota: 5000,
        tokenUsed: 1200,
        storageQuotaMB: 50,
        storageUsedMB: 12,
        period: { start: '2025-01-01', end: '2025-01-31' },
        ledger: []
      },
      workspaces: [
        { id: 'w1', name: 'Default', createdAt: '2025-01-01' }
      ],
      agents: [
        { id: 'a1', name: 'Acme Support', workspaceId: 'w1', status: 'online', systemPrompt: 'Help users politely.' }
      ],
      users: [
        {
          id: 'acme-owner',
          email: 'owner@acme.demo',
          role: 'owner',
          tenantId: 'acme',
          displayName: 'Acme Owner',
          password: 'demo123!',
          devPassword: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'acme-operator',
          email: 'op@acme.demo',
          role: 'operator',
          tenantId: 'acme',
          displayName: 'Acme Operator',
          password: 'demo123!',
          devPassword: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'acme-viewer',
          email: 'view@acme.demo',
          role: 'viewer',
          tenantId: 'acme',
          displayName: 'Acme Viewer',
          password: 'demo123!',
          devPassword: true,
          createdAt: '2025-01-01T00:00:00Z'
        }
      ],
      knowledge: [
        {
          id: 'k1',
          name: 'General',
          files: [
            { id: 'f1', name: 'intro.txt', sizeBytes: 1200, contentType: 'text/plain', createdAt: '2025-01-02T00:00:00Z' },
            { id: 'f2', name: 'logo.png', sizeBytes: 2048, contentType: 'image/png', createdAt: '2025-01-02T00:00:00Z' }
          ]
        }
      ],
      chats: [
        {
          id: 'c1',
          subject: 'Welcome',
          status: 'live',
          agentState: 'idle',
          operatorTaken: false,
          messages: [
            { id: 'm1', role: 'client', text: 'Hi', ts: Date.now() - 10000 },
            { id: 'm2', role: 'agent', text: 'Hello from Acme agent', ts: Date.now() - 5000 }
          ],
          drafts: [
            { id: 'd1', text: 'Pending reply', createdAt: new Date().toISOString() }
          ],
          updatedAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'globex',
      name: 'Globex Corp',
      billing: {
        plan: 'PRO',
        tokenQuota: 50000,
        tokenUsed: 4000,
        storageQuotaMB: 500,
        storageUsedMB: 80,
        period: { start: '2025-01-01', end: '2025-01-31' },
        ledger: []
      },
      workspaces: [ { id: 'w1', name: 'Default', createdAt: '2025-01-01' } ],
      agents: [
        { id: 'a1', name: 'Globex Helper', workspaceId: 'w1', status: 'online', systemPrompt: 'Assist Globex customers.' },
        { id: 'a2', name: 'Globex Sales', workspaceId: 'w1', status: 'online', systemPrompt: 'Sell products.' }
      ],
      users: [
        {
          id: 'globex-owner',
          email: 'owner@globex.demo',
          role: 'owner',
          tenantId: 'globex',
          displayName: 'Globex Owner',
          password: 'demo123!',
          devPassword: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'globex-operator',
          email: 'op@globex.demo',
          role: 'operator',
          tenantId: 'globex',
          displayName: 'Globex Operator',
          password: 'demo123!',
          devPassword: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'globex-viewer',
          email: 'view@globex.demo',
          role: 'viewer',
          tenantId: 'globex',
          displayName: 'Globex Viewer',
          password: 'demo123!',
          devPassword: true,
          createdAt: '2025-01-01T00:00:00Z'
        }
      ],
      knowledge: [
        {
          id: 'k1',
          name: 'Manuals',
          files: [
            { id: 'f1', name: 'guide.pdf', sizeBytes: 4096, contentType: 'application/pdf', createdAt: '2025-01-02T00:00:00Z' },
            { id: 'f2', name: 'faq.txt', sizeBytes: 1024, contentType: 'text/plain', createdAt: '2025-01-02T00:00:00Z' },
            { id: 'f3', name: 'image.jpg', sizeBytes: 3072, contentType: 'image/jpeg', createdAt: '2025-01-02T00:00:00Z' }
          ]
        }
      ],
      chats: [
        {
          id: 'c1',
          subject: 'Order question',
          status: 'paused',
          agentState: 'idle',
          operatorTaken: false,
          messages: [
            { id: 'm1', role: 'client', text: 'Where is my order?', ts: Date.now() - 20000 },
            { id: 'm2', role: 'agent', text: 'Checking on that for you', ts: Date.now() - 15000 }
          ],
          drafts: [],
          updatedAt: new Date().toISOString()
        },
        {
          id: 'c2',
          subject: 'Pricing',
          status: 'live',
          agentState: 'idle',
          operatorTaken: false,
          messages: [
            { id: 'm1', role: 'client', text: 'Pricing?', ts: Date.now() - 12000 }
          ],
          drafts: [],
          updatedAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'initech',
      name: 'Initech',
      billing: {
        plan: 'TEAM',
        tokenQuota: 200000,
        tokenUsed: 55000,
        storageQuotaMB: 2000,
        storageUsedMB: 500,
        period: { start: '2025-01-01', end: '2025-01-31' },
        ledger: []
      },
      workspaces: [ { id: 'w1', name: 'Default', createdAt: '2025-01-01' } ],
      agents: [
        { id: 'a1', name: 'Initech Bot', workspaceId: 'w1', status: 'online', systemPrompt: 'Answer kindly.' }
      ],
      users: [
        {
          id: 'initech-owner',
          email: 'owner@initech.demo',
          role: 'owner',
          tenantId: 'initech',
          displayName: 'Initech Owner',
          password: 'demo123!',
          devPassword: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'initech-operator',
          email: 'op@initech.demo',
          role: 'operator',
          tenantId: 'initech',
          displayName: 'Initech Operator',
          password: 'demo123!',
          devPassword: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'initech-viewer',
          email: 'view@initech.demo',
          role: 'viewer',
          tenantId: 'initech',
          displayName: 'Initech Viewer',
          password: 'demo123!',
          devPassword: true,
          createdAt: '2025-01-01T00:00:00Z'
        }
      ],
      knowledge: [
        {
          id: 'k1',
          name: 'Specs',
          files: [
            { id: 'f1', name: 'spec.md', sizeBytes: 2048, contentType: 'text/markdown', createdAt: '2025-01-02T00:00:00Z' }
          ]
        }
      ],
      chats: [
        {
          id: 'c1',
          subject: 'Bug report',
          status: 'resolved',
          agentState: 'idle',
          operatorTaken: false,
          messages: [
            { id: 'm1', role: 'client', text: 'There is a bug', ts: Date.now() - 30000 },
            { id: 'm2', role: 'agent', text: 'We fixed it', ts: Date.now() - 25000 }
          ],
          drafts: [],
          updatedAt: new Date().toISOString()
        }
      ]
    }
  ]
}
