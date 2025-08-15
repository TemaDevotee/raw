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
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChatConsoleStore } from '../stores/chatConsole'
import ChatBubble from '../components/ChatBubble.vue'
import DraftBubble from '../components/DraftBubble.vue'
import Composer from '../components/Composer.vue'
import Tag from '../components/Tag.vue'
import { impersonateTenant } from '../api/admin'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const store = useChatConsoleStore()
const auth = useAuthStore()
const chatId = route.params.chatId as string
const tenantId = route.params.tenantId as string
const error = ref('')
const canSend = computed(() => auth.can(['owner','operator']))

async function load() {
  try {
    await store.loadChat(tenantId, chatId)
    await store.loadTranscript(chatId)
    await store.loadDrafts(chatId)
    store.startPolling(chatId)
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

onMounted(load)
onUnmounted(() => store.stopPolling())
</script>
