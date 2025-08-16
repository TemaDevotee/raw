<template>
  <div class="flex flex-col gap-1">
    <label class="text-sm">{{ roleLabel }}</label>
    <div class="flex gap-2 items-center">
      <input ref="inputEl" class="flex-1" v-model="text" :placeholder="ph" @keyup.enter="emitSend" />
      <button @click="emitSend" :disabled="disabled">
        <span v-if="busy" class="animate-spin">⏳</span>
        {{ labelSend }}
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { t } from '@/i18n.js';
const props = defineProps<{ role: 'client' | 'agent'; busy: boolean }>();
const emit = defineEmits<{ (e: 'send', text: string): void }>();
const lang = navigator.language.startsWith('ru') ? 'ru' : 'en';
const text = ref('');
const inputEl = ref<HTMLInputElement|null>(null);
const roleLabel = computed(() => t(lang, props.role));
const ph = computed(() => props.role === 'agent' ? 'Agent message… / Сообщение агента…' : 'Client message… / Сообщение клиента…');
const labelSend = 'Send / Отправить';
const disabled = computed(() => props.busy || !text.value.trim());
function emitSend() {
  if (disabled.value) return;
  const tval = text.value;
  text.value = '';
  emit('send', tval);
}
function focus() { inputEl.value?.focus(); }
defineExpose({ focus });
</script>
