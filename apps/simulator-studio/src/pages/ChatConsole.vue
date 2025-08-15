<template>
  <div v-if="store.chat">
    <header class="mb-4">
      <h2 class="text-lg">
        {{ store.chat.subject || '(no subject)' }} • {{ store.chat.workspaceId }} •
        {{ store.chat.status }}
      </h2>
      <div class="flex items-center space-x-2">
        <Tag>{{ auth.role }}</Tag>
        <button @click="openInApp" class="underline text-sm">
          Open in App / Открыть во фронте
        </button>
      </div>
    </header>
    <div class="flex">
      <div class="w-1/2 pr-2 border-r">
        <div>
          <ChatBubble
            v-for="m in store.transcript"
            :key="m.id"
            :role="m.role"
            :ts="m.ts"
          >
            {{ m.text }}
          </ChatBubble>
        </div>
        <Composer
          v-if="canSend"
          placeholder="Write as client / Написать как клиент"
          @send="sendUser"
        />
      </div>
      <div class="w-1/2 pl-2">
        <div class="mb-2 flex items-center space-x-2">
          <button
            @click="generateDraftManual"
            :disabled="generateDisabled"
            :title="generateTitle"
            class="underline text-sm"
            :class="{ 'opacity-50 cursor-not-allowed': generateDisabled }"
          >
            Generate draft / Сгенерировать драфт
          </button>
          <button
            v-if="agentState.state !== 'paused'"
            @click="pauseAgent"
            class="underline text-sm"
          >
            Pause / Пауза
          </button>
          <button
            v-else
            @click="resumeAgent"
            class="underline text-sm"
          >
            Resume / Возобновить
          </button>
          <span v-if="agentState.typing" class="text-xs text-gray-500">
            Agent typing… / Агент печатает…
          </span>
          <span v-if="agentState.error" class="text-xs text-red-500">⚠</span>
        </div>
        <div>
          <template v-for="item in store.timeline" :key="item.id">
            <ChatBubble
              v-if="!item.draft"
              :role="item.from || item.role"
              :ts="item.ts"
            >
              {{ item.text }}
            </ChatBubble>
            <DraftBubble
              v-else
              :id="item.id"
              :text="item.text"
              :ts="item.ts"
              @approve="approve"
              @discard="discard"
            />
          </template>
        </div>
        <Composer
          v-if="canSend"
          placeholder="Reply as agent / Ответить как агент"
          :label="'Send'"
          :label-ru="'Отправить'"
          @send="sendAgent"
        />
        <Composer
          v-if="canSend"
          placeholder="Agent draft / Черновик агента"
          :label="'Save draft'"
          :label-ru="'Сохранить драфт'"
          @send="draft"
        />

        <div v-if="settings" class="mt-4 border-t pt-2">
          <h3 class="text-sm mb-2">Agent Settings / Настройки агента</h3>
          <div class="mb-2">
            <label class="block text-xs">Provider</label>
            <select v-model="settings.provider" class="border p-1 text-sm">
              <option value="mock">Mock</option>
              <option value="openai" :disabled="!settings.available.includes('openai')">OpenAI</option>
            </select>
          </div>
          <div class="mb-2">
            <label class="block text-xs">System prompt</label>
            <textarea v-model="settings.systemPrompt" class="border p-1 w-full text-sm"></textarea>
          </div>
          <div class="mb-2">
            <label class="block text-xs">Temperature</label>
            <input type="range" min="0" max="2" step="0.1" v-model.number="settings.temperature" />
            <span class="text-xs ml-2">{{ settings.temperature.toFixed(1) }}</span>
          </div>
          <div class="mb-2">
            <label class="block text-xs">Max tokens</label>
            <input type="number" v-model.number="settings.maxTokens" class="border p-1 w-24 text-sm" />
          </div>
          <button @click="saveSettings" :disabled="settings.saving" class="underline text-sm" :class="{ 'opacity-50 cursor-not-allowed': settings.saving }">
            Save / Сохранить
          </button>
        </div>
      </div>
    </div>
    <p v-if="store.isPolling" class="text-xs text-gray-500 mt-2">
      Polling… / Получение…
    </p>
    <div
      v-if="error"
      class="fixed bottom-4 right-4 bg-red-500 text-white px-2 py-1"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useChatConsoleStore } from '../stores/chatConsole'
import ChatBubble from '../components/ChatBubble.vue'
import DraftBubble from '../components/DraftBubble.vue'
import Composer from '../components/Composer.vue'
import Tag from '../components/Tag.vue'
import { impersonateTenant } from '../api/admin'
import { useAuthStore } from '../stores/auth'
import { useAdminSse } from '../composables/useAdminSse'
import { useRealtimeStore } from '../stores/realtime'
import { useAgentStore } from '../stores/agent'
import { useAgentSettingsStore } from '../stores/agentSettings'

const route = useRoute()
const store = useChatConsoleStore()
const auth = useAuthStore()
const agents = useAgentStore()
const settingsStore = useAgentSettingsStore()
const chatId = route.params.chatId as string
const tenantId = route.params.tenantId as string
const error = ref('')
const canSend = computed(() => auth.can(['owner','operator']))
const rt = useRealtimeStore()
let sse: any
const agentState = computed(() => agents.byChat[chatId] || { state: 'idle', typing: false, error: null })
const settings = computed(() => settingsStore.byChat[chatId])
const generateDisabled = computed(() => agentState.value.state === 'typing' || agentState.value.error?.code === 'quota_exceeded')
const generateTitle = computed(() => {
  if (agentState.value.state === 'typing') return 'Generating… / Генерация…'
  if (agentState.value.error?.code === 'quota_exceeded') return 'Quota exceeded / Квота исчерпана'
  return ''
})

async function load() {
  try {
    await store.loadChat(tenantId, chatId)
    await store.loadTranscript(chatId)
    await store.loadDrafts(chatId)
    await settingsStore.load(chatId)
    store.startPolling(chatId)
    sse = useAdminSse(tenantId, chatId)
  } catch (e: any) {
    error.value = e.message
  }
}

async function sendUser(text: string) {
  try {
    await store.sendAsUser(chatId, text)
  } catch (e: any) {
    error.value = e.message
  }
}

async function sendAgent(text: string) {
  try {
    await store.sendAsAgent(chatId, text)
  } catch (e: any) {
    error.value = e.message
  }
}

async function draft(text: string) {
  try {
    await store.createAgentDraft(chatId, text)
    await store.loadDrafts(chatId)
  } catch (e: any) {
    error.value = e.message
  }
}

async function pauseAgent() {
  try { await agents.pause(chatId) } catch (e: any) { error.value = e.message }
}

async function resumeAgent() {
  try { await agents.resume(chatId) } catch (e: any) { error.value = e.message }
}

async function generateDraftManual() {
  try { await agents.generate(chatId) } catch (e: any) { error.value = e.message }
}

async function saveSettings() {
  if (!settings.value) return
  try {
    await settingsStore.save(chatId, {
      provider: settings.value.provider,
      systemPrompt: settings.value.systemPrompt,
      temperature: settings.value.temperature,
      maxTokens: settings.value.maxTokens
    })
  } catch (e: any) {
    error.value = e.message
  }
}

async function approve(id: string) {
  try {
    await store.approveDraft(chatId, id)
    await store.loadTranscript(chatId)
    await store.loadDrafts(chatId)
  } catch (e: any) {
    error.value = e.message
  }
}

async function discard(id: string) {
  try {
    await store.discardDraft(chatId, id)
    await store.loadDrafts(chatId)
  } catch (e: any) {
    error.value = e.message
  }
}

async function openInApp() {
  try {
    const { token } = await impersonateTenant(tenantId)
    const base = import.meta.env.VITE_APP_BASE_URL || window.location.origin
    window.open(`${base}/login.html?skipAuth=1#/?impersonate=${token}&chatId=${chatId}`, '_blank')
  } catch (e: any) {
    error.value = e.message
  }
}

onMounted(() => {
  load()
})
onUnmounted(() => {
  store.stopPolling()
  sse?.close()
})

watch(() => rt.status, s => {
  if (s === 'open') store.stopPolling()
})

watch(() => agentState.value.error, e => {
  if (e) error.value = e.message
})
</script>
