<template>
  <div v-if="entry" class="mt-4 border-t pt-2">
    <h3 class="text-sm mb-2">Agent Settings / Настройки агента</h3>
    <div class="mb-2">
      <label class="block text-xs">Provider</label>
      <select v-model="entry.provider" :disabled="!canEdit" class="border p-1 text-sm">
        <option v-for="p in entry.available" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>
    <div v-if="entry.provider === 'openai'" class="mb-2">
      <label class="block text-xs">Model / Модель</label>
      <select v-model="entry.model" :disabled="!canEdit" class="border p-1 text-sm">
        <option value="gpt-4o-mini">gpt-4o-mini</option>
        <option value="gpt-4o">gpt-4o</option>
        <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
      </select>
    </div>
    <div class="mb-2">
      <label class="block text-xs">System prompt</label>
      <textarea v-model="entry.systemPrompt" :disabled="!canEdit" class="border p-1 w-full text-sm"></textarea>
    </div>
    <div class="mb-2">
      <label class="block text-xs">Temperature</label>
      <input type="range" min="0" max="2" step="0.1" v-model.number="entry.temperature" :disabled="!canEdit" />
      <span class="text-xs ml-2">{{ entry.temperature.toFixed(1) }}</span>
    </div>
    <div class="mb-2">
      <label class="block text-xs">Max tokens</label>
      <input type="number" v-model.number="entry.maxTokens" :disabled="!canEdit" class="border p-1 w-24 text-sm" />
    </div>
    <button
      v-if="canEdit"
      @click="save"
      :disabled="entry.saving"
      class="underline text-sm"
      :class="{ 'opacity-50 cursor-not-allowed': entry.saving }"
    >
      Save / Сохранить
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAgentSettingsStore } from '../stores/agentSettings'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{ chatId: string }>()
const store = useAgentSettingsStore()
const auth = useAuthStore()
const entry = computed(() => store.byChat[props.chatId])
const canEdit = computed(() => auth.can(['owner','operator']))
async function save() {
  if (entry.value) await store.save(props.chatId, entry.value)
}
</script>
