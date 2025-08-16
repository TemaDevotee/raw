<template>
  <div class="w-72 border-r p-3">
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-semibold">{{ labelChats }}</h3>
      <div class="flex gap-2">
        <button @click="store.fetchList" :disabled="store.loading">↻</button>
        <button @click="createChat" :disabled="store.posting">+ {{ labelNew }}</button>
      </div>
    </div>
    <ul class="space-y-1">
      <li v-for="c in store.list" :key="c.id">
        <button
          class="w-full text-left px-2 py-1 rounded"
          :class="store.currentId===c.id ? 'bg-slate-700' : ''"
          @click="store.open(c.id)"
        >
          <div class="flex justify-between">
            <span>{{ c.title }}</span>
            <span class="text-xs opacity-70">{{ formatTime(c.updatedAt) }}</span>
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { useChatsStore } from '@studio/stores/chats';
import { showToast } from '@studio/stores/toast';
import dayjs from 'dayjs';
import { t } from '@/i18n.js';
const store = useChatsStore();
const emit = defineEmits<{ (e: 'created'): void }>();
const lang = navigator.language.startsWith('ru') ? 'ru' : 'en';
const labelNew = t(lang, 'newChat');
const labelChats = t(lang, 'chats');
async function createChat() {
  const title = prompt(labelNew);
  if (!title) return;
  try {
    await store.create(title);
    emit('created');
  } catch {
    showToast('Error / Ошибка', 'error');
  }
}
function formatTime(ts: number) {
  return dayjs(ts).format('HH:mm:ss');
}
</script>
