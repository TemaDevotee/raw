import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChatsStore } from '../chats';
import { useAuthStore } from '../authStore';
import { useAgentsStore } from '../agents';
import { useBillingStore } from '../billingStore';
import api from '@/shared/http/api';

vi.mock('@/shared/http/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
vi.mock('@/stores/toast', () => ({ showToast: vi.fn() }));

describe('useChatsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const auth = useAuthStore();
    auth.token = 't';
    auth.user = { id: 'u1', email: 'u@e', name: 'U' } as any;
    auth.tenants = [{ id: 'alpha', name: 'Alpha', role: 'owner' }];
    auth.currentTenantId = 'alpha';
    const billing = useBillingStore();
    billing.tokenBalance = 100;
    vi.resetAllMocks();
  });

  it('passes filters to API', async () => {
    (api.get as any).mockResolvedValue({ data: { items: [] } });
    const store = useChatsStore();
    await store.fetchChats({ status: ['live', 'attention'], q: 'foo', limit: 5 });
    expect((api.get as any).mock.calls[0][1].params).toMatchObject({
      status: 'live,attention',
      q: 'foo',
      limit: 5,
    });
  });

  it('merges transcript', async () => {
    const store = useChatsStore();
    (api.get as any).mockResolvedValueOnce({
      data: { items: [{ id: 'm1', chatId: 'c1', role: 'client', text: 'hi', ts: 1, cursor: 1 }], lastCursor: 1 },
    });
    await store._pollOnce('c1');
    (api.get as any).mockResolvedValueOnce({
      data: {
        items: [
          { id: 'm1', chatId: 'c1', role: 'client', text: 'hi', ts: 1, cursor: 1 },
          { id: 'm2', chatId: 'c1', role: 'agent', text: 'ok', ts: 2, cursor: 2 },
        ],
        lastCursor: 2,
      },
    });
    await store._pollOnce('c1');
    expect(store.transcript['c1'].items.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(store.transcript['c1'].lastCursor).toBe(2);
    (api.get as any).mockResolvedValueOnce({
      data: { items: [{ id: 'm2', chatId: 'c1', role: 'agent', text: 'ok', ts: 2, cursor: 2, draft: false }], lastCursor: 2 },
    });
    await store._pollOnce('c1');
    expect(store.transcript['c1'].items.find((m) => m.id === 'm2')?.draft).toBe(false);
  });

  it('blocks send when another operator controls', async () => {
    const store = useChatsStore();
    store.byId['c1'] = {
      id: 'c1',
      title: 't',
      status: 'live',
      participants: { clientName: 'c', agentId: null },
      presence: { operators: [] },
      control: { mode: 'operator', ownerUserId: 'u2', since: 0 },
      lastMessageAt: 0,
      workspaceId: null,
    } as any;
    await expect(store.sendMessage('c1', { role: 'client', text: 'hi' })).rejects.toThrow();
    expect((api.post as any)).not.toHaveBeenCalled();
  });

  it('agent message under operator control becomes draft', async () => {
    const store = useChatsStore();
    store.byId['c1'] = {
      id: 'c1',
      title: 't',
      status: 'live',
      participants: { clientName: 'c', agentId: null },
      presence: { operators: [] },
      control: { mode: 'operator', ownerUserId: 'u1', since: 0 },
      lastMessageAt: 0,
      workspaceId: null,
    } as any;
    (api.post as any).mockResolvedValue({
      data: { id: 'm1', chatId: 'c1', role: 'agent', text: 'hi', ts: 1, cursor: 1, draft: true },
    });
    const msg = await store.sendMessage('c1', { role: 'agent', text: 'hi' });
    expect(msg.draft).toBe(true);
  });

  it('surface 422 on same status', async () => {
    const store = useChatsStore();
    (api.patch as any).mockRejectedValue({ response: { status: 422 } });
    await expect(store.updateChat('c1', { status: 'live' })).rejects.toBeTruthy();
  });

  it('approveDraft updates message', async () => {
    const store = useChatsStore();
    store.transcript['c1'] = {
      items: [{ id: 'm1', chatId: 'c1', role: 'agent', text: 'hi', ts: 1, cursor: 1, draft: true }],
      lastCursor: 1,
    };
    (api.post as any).mockResolvedValueOnce({
      data: { id: 'm1', chatId: 'c1', role: 'agent', text: 'hi', ts: 1, cursor: 1, draft: false, approvedAt: 5 },
    });
    await store.approveDraft('c1', 'm1');
    expect(store.transcript['c1'].items[0].draft).toBe(false);
    expect(store.transcript['c1'].items[0].approvedAt).toBe(5);
  });

  it('discardDraft removes message', async () => {
    const store = useChatsStore();
    store.transcript['c1'] = {
      items: [{ id: 'm1', chatId: 'c1', role: 'agent', text: 'hi', ts: 1, cursor: 1, draft: true }],
      lastCursor: 1,
    };
    (api.post as any).mockResolvedValueOnce({ data: { ok: true } });
    await store.discardDraft('c1', 'm1');
    expect(store.transcript['c1'].items.length).toBe(0);
  });

  it('filters by agent name locally', async () => {
    const agents = useAgentsStore();
    agents.items = [{ id: 'a1', name: 'Sales', avatarUrl: '' }];
    agents.byId = { a1: agents.items[0] } as any;
    agents.loaded = true;
    const store = useChatsStore();
    (api.get as any).mockResolvedValue({
      data: {
        items: [
          {
            id: 'c1',
            title: 'chat',
            status: 'live',
            participants: { clientName: 'Olga', agentId: 'a1' },
            presence: { operators: [] },
            control: { mode: 'agent', ownerUserId: null, since: 0 },
            lastMessageAt: 0,
            workspaceId: null,
          },
        ],
      },
    });
    await store.fetchChats({ q: 'sales' });
    expect(store.list.length).toBe(1);
  });

  it('handles token 402', async () => {
    const store = useChatsStore();
    store.byId['c1'] = {
      id: 'c1',
      title: 't',
      status: 'live',
      participants: { clientName: 'c', agentId: null },
      presence: { operators: [] },
      control: { mode: 'agent', ownerUserId: null, since: 0 },
      lastMessageAt: 0,
      workspaceId: null,
    } as any;
    (api.post as any).mockRejectedValue({ response: { status: 402, data: { code: 'TOKEN_BALANCE_EXCEEDED', balance: 0, needed: 5 } } });
    await expect(store.sendMessage('c1', { role: 'agent', text: 'hello' })).rejects.toBeTruthy();
  });
});

