import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useKnowledgeStore } from '../knowledgeStore';
import api from '@studio/shared/http/api';

vi.mock('@studio/shared/http/api');

describe('knowledgeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
     (api as any).patch = vi.fn().mockResolvedValue({});
  });

  it('renames file locally', async () => {
    const store = useKnowledgeStore();
    store.files['c1'] = { items: [{ id: 'f1', name: 'old', size: 1, type: 't', uploadedAt: 0, collectionId: 'c1' }] } as any;
    await store.renameFile('f1', 'new');
    expect(store.files['c1'].items[0].name).toBe('new');
  });

  it('ensures collection cache', () => {
    const store = useKnowledgeStore();
    store.ensureCollectionCache('c2');
    expect(store.files['c2']).toBeTruthy();
  });
});
