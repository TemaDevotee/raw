import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import api from '@studio/shared/http/api';
import { showToast } from './toast';

export interface KnowledgeCollection {
  id: string;
  name: string;
  filesCount?: number;
  bytes?: number;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  collectionId: string;
  ext?: string;
}

export interface UploadItem {
  id: string;
  fileName: string;
  size: number;
  collectionId: string;
  pct: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export const useKnowledgeStore = defineStore('knowledge', () => {
  const collections = ref<KnowledgeCollection[]>([]);
  const files = reactive<Record<string, { items: KnowledgeFile[]; nextCursor?: string | null }>>({});
  const usage = ref<{ usedBytes: number; limitBytes: number } | null>(null);
  const uploading = ref<UploadItem[]>([]);
  const filters = ref({ q: '', types: [] as string[], sort: 'date', dir: 'desc' as 'asc' | 'desc' });

  async function fetchCollections() {
    const { data } = await api.get('/admin/knowledge/collections');
    collections.value = data.items || data; // server may return array or {items}
  }

  async function createCollection(name: string) {
    const { data } = await api.post('/admin/knowledge/collections', { name });
    collections.value.push(data);
    showToast('Collection created / Коллекция создана');
  }

  async function renameCollection(id: string, name: string) {
    await api.patch(`/admin/knowledge/collections/${id}`, { name });
    const col = collections.value.find(c => c.id === id);
    if (col) col.name = name;
    showToast('Collection renamed / Коллекция переименована');
  }

  async function deleteCollection(id: string, opts: { force?: boolean } = {}) {
    await api.delete(`/admin/knowledge/collections/${id}${opts.force ? '?force=1' : ''}`);
    const idx = collections.value.findIndex(c => c.id === id);
    if (idx !== -1) collections.value.splice(idx, 1);
    delete files[id];
    showToast('Collection deleted / Коллекция удалена');
  }

  function ensureCollectionCache(collectionId: string) {
    if (!files[collectionId]) files[collectionId] = { items: [], nextCursor: null };
  }

  async function fetchFiles(collectionId: string, opts: { reset?: boolean } = {}) {
    ensureCollectionCache(collectionId);
    const cache = files[collectionId];
    if (opts.reset) cache.items = [];
    const params: any = { collectionId };
    if (cache.nextCursor) params.cursor = cache.nextCursor;
    if (filters.value.q) params.q = filters.value.q;
    if (filters.value.types.length) params.type = filters.value.types.join(',');
    const { data } = await api.get('/admin/knowledge/files', { params });
    cache.items.push(...data.items);
    cache.nextCursor = data.nextCursor;
  }

  async function uploadFiles(collectionId: string, fileList: File[]) {
    for (const file of fileList) {
      const item: UploadItem = {
        id: `${Date.now()}_${file.name}`,
        fileName: file.name,
        size: file.size,
        collectionId,
        pct: 0,
        status: 'pending',
      };
      uploading.value.push(item);
      const form = new FormData();
      form.append('file', file);
      try {
        item.status = 'uploading';
        await api.post(`/admin/knowledge/files/upload?collectionId=${collectionId}`, form, {
          onUploadProgress(e) {
            if (e.total) item.pct = Math.round((e.loaded / e.total) * 100);
          },
        }).then(res => {
          const returned = res.data.items || [res.data];
          ensureCollectionCache(collectionId);
          files[collectionId].items.unshift(...returned);
          item.status = 'done';
        });
      } catch (err: any) {
        item.status = 'error';
        item.error = err.response?.data?.code || err.message;
        showToast(item.error || 'Upload failed / Ошибка загрузки', 'error');
      }
    }
  }

  async function renameFile(id: string, name: string) {
    await api.patch(`/admin/knowledge/files/${id}`, { name });
    for (const col of Object.keys(files)) {
      const f = files[col].items.find(x => x.id === id);
      if (f) f.name = name;
    }
    showToast('File renamed / Файл переименован');
  }

  async function moveFile(id: string, toCollectionId: string) {
    await api.patch(`/admin/knowledge/files/${id}`, { collectionId: toCollectionId });
    let moved: KnowledgeFile | null = null;
    for (const col of Object.keys(files)) {
      const idx = files[col].items.findIndex(f => f.id === id);
      if (idx !== -1) {
        moved = files[col].items.splice(idx, 1)[0];
        break;
      }
    }
    if (moved) {
      ensureCollectionCache(toCollectionId);
      moved.collectionId = toCollectionId;
      files[toCollectionId].items.unshift(moved);
    }
    showToast('File moved / Файл перемещён');
  }

  async function deleteFile(id: string) {
    await api.delete(`/admin/knowledge/files/${id}`);
    for (const col of Object.keys(files)) {
      const idx = files[col].items.findIndex(f => f.id === id);
      if (idx !== -1) files[col].items.splice(idx, 1);
    }
    showToast('File deleted / Файл удалён');
  }

  async function refreshUsage() {
    const { data } = await api.get('/admin/knowledge/usage');
    usage.value = data;
  }

  return {
    collections,
    files,
    usage,
    uploading,
    filters,
    fetchCollections,
    createCollection,
    renameCollection,
    deleteCollection,
    fetchFiles,
    uploadFiles,
    renameFile,
    moveFile,
    deleteFile,
    refreshUsage,
    ensureCollectionCache,
  };
});

