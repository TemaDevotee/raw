<template>
  <div class="flex h-full">
    <aside class="w-48 border-r p-4 space-y-2">
      <div v-for="c in store.collections" :key="c.id" @click="select(c.id)"
           :class="['cursor-pointer', c.id===selected ? 'font-bold' : '']">{{ c.name }}</div>
      <button class="text-sm underline" @click="create">New collection / Новая коллекция</button>
    </aside>
    <main class="flex-1 p-4">
      <div class="flex items-center mb-4 space-x-2">
        <input v-model="store.filters.q" @input="refreshFiles" placeholder="Search... / Поиск..." class="p-1 flex-1" />
        <QuotaBar v-if="store.usage" :used-bytes="store.usage.usedBytes" :limit-bytes="store.usage.limitBytes" />
        <button class="bg-primary-600 px-3 py-1 rounded text-white" @click="drawer=true">Add knowledge / Добавить знания</button>
      </div>
      <table class="w-full text-sm">
        <thead><tr><th class="text-left">Name / Имя</th><th>Size / Размер</th><th>Uploaded / Загружено</th><th></th></tr></thead>
        <tbody>
          <tr v-for="f in currentFiles" :key="f.id" class="border-t border-neutral-700">
            <td class="py-1"><FileIcon :ext="f.ext" />{{ f.name }}</td>
            <td class="text-right">{{ (f.size/1024).toFixed(1) }} KB</td>
            <td class="text-right">{{ new Date(f.uploadedAt).toLocaleDateString() }}</td>
            <td class="text-right">
              <Popover>
                <template #trigger><button class="px-2">⋮</button></template>
                <div class="bg-neutral-700 text-white rounded shadow p-2 space-y-1">
                  <button class="block" @click="preview(f)">Preview / Просмотр</button>
                  <a class="block" :href="downloadUrl(f)" target="_blank">Download / Скачать</a>
                  <button class="block" @click="remove(f)">Delete / Удалить</button>
                </div>
              </Popover>
            </td>
          </tr>
        </tbody>
      </table>
      <button v-if="store.files[selected]?.nextCursor" class="mt-2 underline" @click="loadMore">Load more / Ещё</button>
    </main>
  </div>
  <KnowledgeAddDrawer :open="drawer" :collection-id="selected" @close="drawer=false" />
  <Modal :open="previewing!==null" @close="previewing=null">
    <pre v-if="previewing && previewing.type.startsWith('text')" class="whitespace-pre-wrap">{{ previewContent }}</pre>
    <img v-else-if="previewing && previewing.type.startsWith('image')" :src="downloadUrl(previewing)" class="max-w-md" />
    <div v-else>Unsupported preview</div>
  </Modal>
  <ToastContainer />
</template>
<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useKnowledgeStore } from '@studio/stores/knowledgeStore';
import QuotaBar from '@studio/components/knowledge/QuotaBar.vue';
import KnowledgeAddDrawer from '@studio/components/knowledge/KnowledgeAddDrawer.vue';
import FileIcon from '@studio/components/file/FileIcon.vue';
import Popover from '@studio/components/ui/Popover.vue';
import Modal from '@studio/components/ui/Modal.vue';
import ToastContainer from '@studio/components/ToastContainer.vue';

const store = useKnowledgeStore();
const selected = ref('');
const drawer = ref(false);
const previewing = ref<any>(null);
const previewContent = ref('');

function select(id: string) {
  selected.value = id;
  store.fetchFiles(id, { reset: true });
}

async function create() {
  const name = prompt('Collection name');
  if (name) await store.createCollection(name);
}

function loadMore() {
  store.fetchFiles(selected.value);
}

const currentFiles = computed(() => store.files[selected.value]?.items || []);

function downloadUrl(f: any) {
  return `/admin/knowledge/files/${f.id}/download`;
}

function preview(f: any) {
  previewing.value = f;
  if (f.type.startsWith('text')) {
    fetch(downloadUrl(f)).then(r => r.text()).then(t => (previewContent.value = t));
  } else {
    previewContent.value = '';
  }
}

function remove(f: any) {
  if (confirm('Delete file?')) store.deleteFile(f.id);
}

function refreshFiles() {
  if (selected.value) store.fetchFiles(selected.value, { reset: true });
}

onMounted(async () => {
  await store.fetchCollections();
  if (store.collections.length) {
    selected.value = store.collections[0].id;
    store.fetchFiles(selected.value, { reset: true });
  }
  store.refreshUsage();
});

watch(
  () => store.filters.q,
  () => {
    refreshFiles();
  }
);
</script>
