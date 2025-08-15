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
            v-if="agentState.state === 'typing'"
            @click="abortAgent"
            class="underline text-sm"
          >
            Abort / Прервать
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
          <span v-if="agentState.error || providerError" class="text-xs text-red-500">⚠</span>
        </div>
        <div v-if="usage" class="text-xs text-gray-500 mb-2">
          Usage: {{ usage.totalTokens }} tokens{{ usage.estimated ? ' (estimated)' : '' }} / Токены: {{ usage.totalTokens }}{{ usage.estimated ? ' (примерно)' : '' }}
        </div>
        <div v-if="providerError" class="text-xs text-red-600 mb-2">
          {{ providerErrorMsg }}
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

          <AgentSettingsPanel :chat-id="chatId" />
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
import AgentSettingsPanel from '../components/AgentSettingsPanel.vue'
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
const providerError = computed(() => settings.value?.providerError)
const generateDisabled = computed(() => agentState.value.state === 'typing' || agentState.value.error?.code === 'quota_exceeded' || providerError.value)
const generateTitle = computed(() => {
  if (agentState.value.state === 'typing') return 'Generating… / Генерация…'
  if (agentState.value.error?.code === 'quota_exceeded') return 'Quota exceeded / Квота исчерпана'
  if (providerError.value) return 'Provider error / Ошибка провайдера'
  return ''
})
const usage = computed(() => agentState.value.usage)
const providerErrorMsg = computed(() => {
  const map: Record<string, string> = {
    invalid_api_key: 'Invalid API key / Неверный API-ключ',
    rate_limited: 'Rate limited by provider / Лимиты провайдера исчерпаны',
    context_length_exceeded: 'Context window exceeded / Превышено окно контекста',
    server_unavailable: 'Provider is temporarily unavailable / Провайдер временно недоступен',
    network_error: 'Network error while contacting provider / Сетевая ошибка при обращении к провайдеру',
    mock_failure: 'Mock provider simulated failure / Симулированная ошибка провайдера',
    unknown: 'Unexpected provider error / Неизвестная ошибка провайдера'
  }
  if (!providerError.value) return ''
  return map[providerError.value.code] || providerError.value.message
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

async function abortAgent() {
  try { await agents.abort(chatId) } catch (e: any) { error.value = e.message }
}

async function generateDraftManual() {
  try {
    settingsStore.clearError(chatId)
    error.value = ''
    await agents.generate(chatId)
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
watch(() => providerError.value, e => {
  if (e) error.value = providerErrorMsg.value
})
</script>
