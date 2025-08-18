<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>
    <div class="absolute top-0 right-0 w-80 h-full bg-neutral-800 text-white shadow-lg p-4 overflow-y-auto">
      <button class="mb-4" @click="emit('close')">×</button>
      <div class="mb-4">
        <button :class="tab==='upload' ? 'font-bold' : ''" @click="tab='upload'">Upload files / Загрузить файлы</button>
        <button class="ml-4" :class="tab==='text' ? 'font-bold' : ''" @click="tab='text'">New text note / Новая заметка</button>
      </div>
      <div v-if="tab==='upload'">
        <div class="border border-dashed p-4 text-center" @dragover.prevent @drop.prevent="onDrop">
          <input type="file" multiple class="hidden" ref="picker" @change="onPick" />
          <p>Drag & drop files or <button class="underline" @click.prevent="picker?.click()">Browse / Выбрать</button></p>
        </div>
        <div v-for="u in store.uploading" :key="u.id" class="mt-2 text-sm">
          {{ u.fileName }} — <span v-if="u.status==='error'">Error / Ошибка</span><span v-else>{{ u.pct }}%</span>
        </div>
      </div>
      <div v-else>
        <input v-model="noteTitle" placeholder="Title / Заголовок" class="w-full mb-2 p-1 text-black" />
        <textarea v-model="noteText" rows="6" class="w-full mb-2 p-1 text-black" />
        <button class="bg-primary-600 px-3 py-1 rounded" @click="saveNote">Save / Сохранить</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useKnowledgeStore } from '@studio/stores/knowledgeStore';
const props = defineProps<{ open: boolean; collectionId: string }>();
const emit = defineEmits(['close']);
const store = useKnowledgeStore();
const tab = ref<'upload' | 'text'>('upload');
const picker = ref<HTMLInputElement>();
function onPick(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files) store.uploadFiles(props.collectionId, Array.from(files));
}
function onDrop(e: DragEvent) {
  if (e.dataTransfer?.files) {
    store.uploadFiles(props.collectionId, Array.from(e.dataTransfer.files));
  }
}
const noteTitle = ref('');
const noteText = ref('');
async function saveNote() {
  if (!noteText.value.trim()) return;
  const blob = new Blob([noteText.value], { type: 'text/markdown' });
  const file = new File([blob], noteTitle.value || 'note.md', { type: 'text/markdown' });
  await store.uploadFiles(props.collectionId, [file]);
  noteTitle.value = '';
  noteText.value = '';
  tab.value = 'upload';
}
</script>
