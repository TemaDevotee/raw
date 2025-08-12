import { describe, it, expect, vi } from 'vitest';
import { useAdminChatStore } from '../chats';
import * as api from '../../api/client';

describe('admin chat store', () => {
  it('pushes message after send', async () => {
    vi.spyOn(api, 'postAdminMessage').mockResolvedValue({ id: 'm1', role: 'client', text: 'hi', ts: 1 });
    const store = useAdminChatStore();
    await store.sendMessage('c1', 'client', 'hi');
    expect(store.transcript.length).toBe(1);
    expect(store.transcript[0].id).toBe('m1');
  });
});
