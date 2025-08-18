import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { estimateTokens, PLANS } from '../services/billing.js';

function writeFile(slug, name, content, mime, root) {
  const dir = path.join(root, slug);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  const size = Buffer.byteLength(content);
  return { id: nanoid(), name, size, mime, uploadedAt: Date.now(), path: `/files/${slug}/${name}` };
}

export function seedDemo(db, { writeFiles = false } = {}) {
  const root = path.resolve('.mockdb/files');
  if (writeFiles) {
    fs.rmSync(root, { recursive: true, force: true });
    fs.mkdirSync(root, { recursive: true });
  }
  db.tenants = [];
  db.users = [];
  const summary = [];
  const now = Date.now();

  // demo users
  const alphaOwnerId = nanoid();
  db.users.push({
    id: alphaOwnerId,
    email: 'alpha@raw.dev',
    name: 'Alpha Owner',
    password: 'RawDev!2025',
    isActive: true,
    memberships: [
      { tenantId: 'alpha', role: 'owner' },
      { tenantId: 'beta', role: 'operator' },
    ],
    createdAt: now,
    updatedAt: now,
  });
  const alphaOpId = nanoid();
  db.users.push({
    id: alphaOpId,
    email: 'alpha.op@raw.dev',
    name: 'Alpha Operator',
    password: 'RawDev!2025',
    isActive: true,
    memberships: [{ tenantId: 'alpha', role: 'operator' }],
    createdAt: now,
    updatedAt: now,
  });
  db.users.push({
    id: nanoid(),
    email: 'alpha.view@raw.dev',
    name: 'Alpha Viewer',
    password: 'RawDev!2025',
    isActive: true,
    memberships: [{ tenantId: 'alpha', role: 'viewer' }],
    createdAt: now,
    updatedAt: now,
  });
  db.users.push({
    id: nanoid(),
    email: 'beta@raw.dev',
    name: 'Beta Owner',
    password: 'RawDev!2025',
    isActive: true,
    memberships: [{ tenantId: 'beta', role: 'owner' }],
    createdAt: now,
    updatedAt: now,
  });
  db.users.push({
    id: nanoid(),
    email: 'beta.op@raw.dev',
    name: 'Beta Operator',
    password: 'RawDev!2025',
    isActive: true,
    memberships: [{ tenantId: 'beta', role: 'operator' }],
    createdAt: now,
    updatedAt: now,
  });
  db.users.push({
    id: nanoid(),
    email: 'gamma@raw.dev',
    name: 'Gamma Owner',
    password: 'RawDev!2025',
    isActive: true,
    memberships: [{ tenantId: 'gamma', role: 'owner' }],
    createdAt: now,
    updatedAt: now,
  });

  // helper to push tenant and summary
  function pushTenant(t) {
    db.tenants.push(t);
    const fileCount = t.knowledge.collections.reduce((a, c) => a + c.files.length, 0);
    summary.push({
      slug: t.slug,
      plan: t.plan,
      quotas: t.quotas,
      usage: t.usage,
      counts: { chats: t.chats.length, messages: t.messages.length, files: fileCount },
    });
  }

  // Alpha tenant
  {
    const slug = 'alpha';
    const plan = PLANS.pro;
    let tokenBalance = plan.includedMonthlyTokens;
    const spendLogs = [];
    const agents = [
      { id: nanoid(), name: 'Sales Assistant', avatarUrl: '/avatars/agent1.svg', approveMode: 'off', model: 'gpt-4' },
      { id: nanoid(), name: 'Support L1', avatarUrl: '/avatars/agent2.svg', approveMode: 'manual', model: 'gpt-4' },
    ];
    const workspaces = [
      { id: nanoid(), name: 'Default' },
      { id: nanoid(), name: 'Website' },
    ];
    const files = [];
    if (writeFiles) {
      files.push(writeFile(slug, 'welcome.txt', 'Welcome to alpha knowledge', 'text/plain', root));
      files.push(writeFile(slug, 'faq.md', '# FAQ\nAlpha answers', 'text/markdown', root));
    }
    const knowledge = { collections: [{ id: nanoid(), name: 'General', files }] };
    const chats = [];
    const messages = [];
    const _cursors = {};

    function addMessage(chat, data) {
      const cursor = (_cursors[chat.id] || 0) + 1;
      _cursors[chat.id] = cursor;
      const msg = {
        id: nanoid(),
        chatId: chat.id,
        cursor,
        approvedAt: null,
        discardedAt: null,
        deliveredAt: data.draft ? null : data.ts,
        ...data,
      };
      messages.push(msg);
      if (data.role === 'agent') {
        const tks = estimateTokens(data.text);
        tokenBalance -= tks;
        spendLogs.push({
          id: nanoid(),
          ts: data.ts,
          tenantId: '',
          chatId: chat.id,
          agentId: chat.participants.agentId,
          messageId: msg.id,
          role: 'agent',
          tokens: tks,
          note: data.draft ? 'draft' : 'sent',
        });
      }
    }

    const chat1 = {
      id: nanoid(),
      title: 'Website pricing',
      status: 'live',
      workspaceId: workspaces[0].id,
      participants: { clientName: 'Olga S.', agentId: agents[0].id },
      presence: { operators: [alphaOpId] },
      control: { mode: 'agent', ownerUserId: null, since: now },
      lastMessageAt: now,
    };
    chats.push(chat1);
    addMessage(chat1, { role: 'client', text: 'Hi, how much?', ts: now - 300000 });
    addMessage(chat1, { role: 'agent', text: 'Our plans start at $10.', ts: now - 290000 });

    const chat2 = {
      id: nanoid(),
      title: 'Billing issue',
      status: 'attention',
      workspaceId: workspaces[0].id,
      participants: { clientName: 'Ivan P.', agentId: null },
      presence: { operators: [] },
      control: { mode: 'agent', ownerUserId: null, since: now },
      lastMessageAt: now - 100000,
    };
    chats.push(chat2);
    addMessage(chat2, { role: 'client', text: 'I was double charged', ts: now - 120000 });
    addMessage(chat2, { role: 'agent', text: 'Let me check that for you', ts: now - 115000 });
    addMessage(chat2, { role: 'agent', text: 'Please provide invoice number', ts: now - 110000, draft: true });

    const chat3 = {
      id: nanoid(),
      title: 'Onboarding help',
      status: 'paused',
      workspaceId: workspaces[1].id,
      participants: { clientName: 'Maria K.', agentId: agents[1].id },
      presence: { operators: [alphaOpId] },
      control: { mode: 'agent', ownerUserId: null, since: now },
      lastMessageAt: now - 200000,
    };
    chats.push(chat3);
    addMessage(chat3, { role: 'client', text: 'How do I start?', ts: now - 210000 });
    addMessage(chat3, { role: 'agent', text: 'Follow the guide in dashboard.', ts: now - 205000 });

    const chat4 = {
      id: nanoid(),
      title: 'General feedback',
      status: 'resolved',
      workspaceId: workspaces[0].id,
      participants: { clientName: 'Dmitry R.', agentId: agents[0].id },
      presence: { operators: [] },
      control: { mode: 'agent', ownerUserId: null, since: now },
      lastMessageAt: now - 500000,
    };
    chats.push(chat4);
    addMessage(chat4, { role: 'client', text: 'Great service!', ts: now - 510000 });
    addMessage(chat4, { role: 'agent', text: 'Thanks for feedback!', ts: now - 505000 });

    const quotas = { tokensMonthly: plan.includedMonthlyTokens, storageMB: 500, maxAgents: 5, maxWorkspaces: 5 };
    const usage = { tokensUsed: plan.includedMonthlyTokens - tokenBalance, storageUsedMB: files.reduce((a, f) => a + f.size, 0) / 1024 / 1024 };

    const tenantId = nanoid();
    spendLogs.forEach((l) => (l.tenantId = tenantId));
    const billing = { plan, tokenBalance, cycleResetAt: now };

    pushTenant({
      id: tenantId,
      slug,
      name: 'Alpha',
      plan: 'Pro',
      quotas,
      usage,
      agents,
      workspaces,
      knowledge,
      chats,
      messages,
      _cursors,
      billing,
      spendLogs,
    });
  }

  // Bravo tenant
  {
    const slug = 'bravo';
    const plan = PLANS.free;
    let tokenBalance = plan.includedMonthlyTokens;
    const spendLogs = [];
    const agents = [
      { id: nanoid(), name: 'Solo Bot', avatarUrl: '/avatars/agent1.svg', approveMode: 'off', model: 'gpt-3.5' },
    ];
    const workspaces = [{ id: nanoid(), name: 'Default' }];
    const files = [];
    if (writeFiles) {
      files.push(writeFile(slug, 'notes.txt', 'Bravo knowledge base', 'text/plain', root));
    }
    const knowledge = { collections: [{ id: nanoid(), name: 'General', files }] };
    const chats = [];
    const messages = [];
    const _cursors = {};

    function addMessage(chat, data) {
      const cursor = (_cursors[chat.id] || 0) + 1;
      _cursors[chat.id] = cursor;
      const msg = {
        id: nanoid(),
        chatId: chat.id,
        cursor,
        approvedAt: null,
        discardedAt: null,
        deliveredAt: data.draft ? null : data.ts,
        ...data,
      };
      messages.push(msg);
      if (data.role === 'agent') {
        const tks = estimateTokens(data.text);
        tokenBalance -= tks;
        spendLogs.push({
          id: nanoid(),
          ts: data.ts,
          tenantId: '',
          chatId: chat.id,
          agentId: chat.participants.agentId,
          messageId: msg.id,
          role: 'agent',
          tokens: tks,
          note: data.draft ? 'draft' : 'sent',
        });
      }
    }

    const chat1 = {
      id: nanoid(),
      title: 'Order status',
      status: 'live',
      workspaceId: workspaces[0].id,
      participants: { clientName: 'Sergey A.', agentId: agents[0].id },
      presence: { operators: [] },
      control: { mode: 'agent', ownerUserId: null, since: now },
      lastMessageAt: now - 10000,
    };
    chats.push(chat1);
    addMessage(chat1, { role: 'client', text: 'Where is my order?', ts: now - 20000 });
    addMessage(chat1, { role: 'agent', text: 'It ships tomorrow.', ts: now - 15000 });
    const chat2 = {
      id: nanoid(),
      title: 'Subscription',
      status: 'attention',
      workspaceId: workspaces[0].id,
      participants: { clientName: 'Elena T.', agentId: null },
      presence: { operators: [] },
      control: { mode: 'agent', ownerUserId: null, since: now },
      lastMessageAt: now - 30000,
    };
    chats.push(chat2);
    addMessage(chat2, { role: 'client', text: 'How to cancel?', ts: now - 35000 });
    addMessage(chat2, { role: 'agent', text: 'Use the dashboard link.', ts: now - 33000 });
    const quotas = { tokensMonthly: plan.includedMonthlyTokens, storageMB: 50, maxAgents: 1, maxWorkspaces: 1 };
    const usage = { tokensUsed: plan.includedMonthlyTokens - tokenBalance, storageUsedMB: files.reduce((a, f) => a + f.size, 0) / 1024 / 1024 };
    const tenantId = nanoid();
    spendLogs.forEach((l) => (l.tenantId = tenantId));
    const billing = { plan, tokenBalance, cycleResetAt: now };
    pushTenant({
      id: tenantId,
      slug,
      name: 'Bravo',
      plan: 'Free',
      quotas,
      usage,
      agents,
      workspaces,
      knowledge,
      chats,
      messages,
      _cursors,
      billing,
      spendLogs,
    });
  }

  // Charlie tenant
  {
    const slug = 'charlie';
    const plan = PLANS.business;
    let tokenBalance = plan.includedMonthlyTokens;
    const spendLogs = [];
    const agents = [
      { id: nanoid(), name: 'Enterprise Bot', avatarUrl: '/avatars/agent1.svg', approveMode: 'off', model: 'gpt-4' },
      { id: nanoid(), name: 'Support L2', avatarUrl: '/avatars/agent2.svg', approveMode: 'manual', model: 'gpt-4' },
      { id: nanoid(), name: 'Sales Pro', avatarUrl: '/avatars/agent3.svg', approveMode: 'manual', model: 'gpt-4' },
    ];
    const workspaces = [
      { id: nanoid(), name: 'Default' },
      { id: nanoid(), name: 'RU market' },
      { id: nanoid(), name: 'Enterprise' },
    ];
    const files = [];
    if (writeFiles) {
      files.push(writeFile(slug, 'readme.txt', 'Charlie docs', 'text/plain', root));
      files.push(writeFile(slug, 'overview.md', '# Overview', 'text/markdown', root));
    }
    const knowledge = { collections: [{ id: nanoid(), name: 'General', files }] };
    const chats = [];
    const messages = [];
    const _cursors = {};

    function addMessage(chat, data) {
      const cursor = (_cursors[chat.id] || 0) + 1;
      _cursors[chat.id] = cursor;
      const msg = {
        id: nanoid(),
        chatId: chat.id,
        cursor,
        approvedAt: null,
        discardedAt: null,
        deliveredAt: data.draft ? null : data.ts,
        ...data,
      };
      messages.push(msg);
      if (data.role === 'agent') {
        const tks = estimateTokens(data.text);
        tokenBalance -= tks;
        spendLogs.push({
          id: nanoid(),
          ts: data.ts,
          tenantId: '',
          chatId: chat.id,
          agentId: chat.participants.agentId,
          messageId: msg.id,
          role: 'agent',
          tokens: tks,
          note: data.draft ? 'draft' : 'sent',
        });
      }
    }

    const chat1 = {
      id: nanoid(),
      title: 'Partnership',
      status: 'live',
      workspaceId: workspaces[2].id,
      participants: { clientName: 'Company X', agentId: agents[2].id },
      presence: { operators: [] },
      control: { mode: 'agent', ownerUserId: null, since: now },
      lastMessageAt: now - 40000,
    };
    chats.push(chat1);
    addMessage(chat1, { role: 'client', text: 'We want to partner', ts: now - 50000 });
    addMessage(chat1, { role: 'agent', text: 'Let us schedule a call.', ts: now - 45000 });
    const chat2 = {
      id: nanoid(),
      title: 'Bug report',
      status: 'paused',
      workspaceId: workspaces[0].id,
      participants: { clientName: 'Anna L.', agentId: agents[1].id },
      presence: { operators: [] },
      control: { mode: 'agent', ownerUserId: null, since: now },
      lastMessageAt: now - 60000,
    };
    chats.push(chat2);
    addMessage(chat2, { role: 'client', text: 'Found a bug', ts: now - 65000 });
    addMessage(chat2, { role: 'agent', text: 'We are investigating.', ts: now - 62000 });
    const chat3 = {
      id: nanoid(),
      title: 'Invoice',
      status: 'resolved',
      workspaceId: workspaces[1].id,
      participants: { clientName: 'OAO Example', agentId: agents[0].id },
      presence: { operators: [] },
      control: { mode: 'agent', ownerUserId: null, since: now },
      lastMessageAt: now - 80000,
    };
    chats.push(chat3);
    addMessage(chat3, { role: 'client', text: 'Need invoice', ts: now - 90000 });
    addMessage(chat3, { role: 'agent', text: 'Sent to your email.', ts: now - 85000 });
    const quotas = { tokensMonthly: plan.includedMonthlyTokens, storageMB: 5000, maxAgents: 15, maxWorkspaces: 20 };
    const usage = { tokensUsed: plan.includedMonthlyTokens - tokenBalance, storageUsedMB: files.reduce((a, f) => a + f.size, 0) / 1024 / 1024 };
    const tenantId = nanoid();
    spendLogs.forEach((l) => (l.tenantId = tenantId));
    const billing = { plan, tokenBalance, cycleResetAt: now };
    pushTenant({
      id: tenantId,
      slug,
      name: 'Charlie',
      plan: 'Business',
      quotas,
      usage,
      agents,
      workspaces,
      knowledge,
      chats,
      messages,
      _cursors,
      billing,
      spendLogs,
    });
  }

  return { tenants: summary };
}
