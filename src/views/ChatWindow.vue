<template>
  <div class="flex flex-col h-full">
    <!-- Gradient header with controls -->
    <div class="chat-header shadow-sm" :style="headerStyle">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center gap-4">
          <router-link to="/chats">
            <Button variant="secondary" size="sm">
              <span class="material-icons-outlined mr-1">arrow_back</span>
              {{ langStore.t('backToAll') }}
            </Button>
          </router-link>
          <h2 class="text-xl font-bold">{{ chat?.clientName || langStore.t('chat') }}</h2>
          <span
            v-if="chat"
            class="ml-2 text-xs px-2 py-0.5 rounded-full flex items-center"
            :style="{ backgroundColor: badgeColor(chat.status), color: statusColor(chat.status) }"
          >
            <span
              class="w-2 h-2 rounded-full mr-1"
              :style="{ backgroundColor: statusColor(chat.status) }"
            ></span>
            {{ statusLabel }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="!inputEnabled"
            data-testid="interfere-btn"
            :disabled="busyByOthers"
            variant="primary"
            size="sm"
            @click="interfere"
          >
            {{ langStore.t('interfere') }}
          </Button>
          <Button
            v-else
            data-testid="return-btn"
            variant="secondary"
            size="sm"
            @click="returnControl"
          >
            {{ langStore.t('returnToAgent') }}
          </Button>
          <div class="relative" ref="statusMenuRef" @keydown.escape="statusMenuOpen = false">
            <Button variant="secondary" size="sm" data-testid="status-menu-btn" @click="statusMenuOpen = !statusMenuOpen">
              {{ langStore.t('changeStatus') }}
            </Button>
            <ul
              v-if="statusMenuOpen"
              data-testid="status-menu"
              class="absolute right-0 mt-1 w-40 rounded-md border border-default bg-secondary z-10"
            >
              <li v-for="opt in statusOptions" :key="opt.value">
                <button
                  class="flex items-center w-full px-3 py-2 text-left hover-bg-effect"
                  @click="setStatus(opt.value)"
                >
                  <span
                    class="w-2 h-2 rounded-full mr-2"
                    :style="{ backgroundColor: statusColor(opt.value) }"
                  ></span>
                  {{ langStore.t(opt.label) }}
                </button>
              </li>
            </ul>
          </div>
          <span
            v-if="presenceCount"
            data-testid="presence-badge"
            class="text-xs px-2 py-1 rounded-full"
            :style="{ backgroundColor: badgeColor(chat?.status), color: statusColor(chat?.status) }"
          >
            {{ presenceCount }}
          </span>
        </div>
      </div>
    </div>
    <!-- Messages list -->
    <div ref="messagesContainer" class="flex-1 p-6 overflow-y-auto space-y-4 bg-secondary">
      <!-- Drafts panel -->
      <div v-if="drafts.length" class="p-3 rounded-lg border border-default bg-white/5 mb-3">
        <div class="flex items-center justify-between mb-2">
          <strong>{{ langStore.t('draftsWaiting') || 'Drafts waiting approval' }}</strong>
          <Button variant="secondary" size="sm" @click="simulateDraft">
            {{ langStore.t('simulate') || 'Simulate' }}
          </Button>
        </div>
        <div
          v-for="d in drafts"
          :key="d.id"
          class="flex items-center justify-between py-2 border-b border-default last:border-b-0"
        >
          <span class="text-sm">{{ d.text }}</span>
          <div class="flex gap-2">
            <Button variant="primary" size="sm" @click="approveDraft(d)">
              {{ langStore.t('approve') || 'Approve' }}
            </Button>
            <Button variant="secondary" size="sm" @click="discardDraft(d)">
              {{ langStore.t('discard') || 'Discard' }}
            </Button>
          </div>
        </div>
      </div>
      <!-- Placeholder when no chat selected -->
      <div v-if="!chat" class="text-center text-muted mt-10">
        {{ langStore.t('selectChat') }}
      </div>
      <!-- Approve mode toggle -->
      <div class="px-6 py-3 border-b border-default flex items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" :checked="approveRequired" @change="toggleApprove($event)">
          <span>{{ langStore.t('requiresApproval') || 'Requires approval' }}</span>
        </label>
      </div>
      <!-- Messages -->
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="flex"
        :class="messageAlignment(msg.sender)"
      >
        <div :class="messageBubbleClasses(msg.sender)">
          <p class="text-sm whitespace-pre-wrap">{{ msg.text }}</p>
          <span class="text-xs block mt-1">{{ formatMessageTime(msg.time) }}</span>
        </div>
      </div>
    </div>
    <!-- Composer and actions -->
    <div class="p-4 border-t border-default bg-secondary">
      <div class="flex items-center mb-2">
        <input
          v-model="newMessage"
          type="text"
          :disabled="!inputEnabled"
          :placeholder="placeholderText"
          class="flex-1 form-input mr-3 rounded-full"
          @keyup.enter="sendMessage"
          @input="onType"
        />
        <Button
          variant="primary"
          size="sm"
          :disabled="!inputEnabled || !newMessage"
          @click="sendMessage"
        >
          <span class="material-icons-outlined text-base mr-1">send</span>
          {{ langStore.t('send') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from '@/components/ui/Button.vue';
import { ref, onMounted, computed, onBeforeUnmount, watch, nextTick } from 'vue';
import langStore from '@/stores/langStore.js';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/api';
import { showToast } from '@/stores/toastStore';
import { statusColor, badgeColor, statusGradient } from './chatsUtils.js';


const presenceList = ref([]);
const currentUser = JSON.parse(localStorage.getItem('auth.user') || sessionStorage.getItem('auth.user') || 'null') || { id: 1 };
async function refreshPresence(){ try{ const res = await apiClient.get('/presence'); const list = res.data[String(chatId)] || []; presenceList.value = list; } catch{} }
const busyByOthers = computed(() => presenceList.value.some(p => p.userId !== currentUser.id));
const presenceCount = computed(() => presenceList.value.length);
const messages = ref([]);
const messagesContainer = ref(null);
setInterval(refreshPresence, 12000);
watch(messages, () => {
  nextTick(() => {
    const el = messagesContainer.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
});
const route = useRoute();
const router = useRouter();
const chatId = route.params.id;

const approveRequired = ref(false);
const chat = ref(null);
const drafts = ref([]);
const newMessage = ref('');
const sendMode = ref('direct');
const sendModeComputed = computed({
  get: () => sendMode.value === 'approve',
  set: (v) => (sendMode.value = v ? 'approve' : 'direct'),
});
const typing = ref(false);
let typingTimer = null;
function onType() {
  typing.value = true;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => (typing.value = false), 1200);
}
// control state
const chatControl = ref('agent');
const inputEnabled = computed(() => chatControl.value === 'operator');
// Agents list for resolving assigned agent names
const agentsList = ref([]);
const subtitle = computed(() => (chat.value ? `ID: ${chatId}` : ''));

const placeholderText = computed(() =>
  inputEnabled.value
    ? langStore.t('operatorInControl')
    : langStore.t('agentInControl')
);

const statusMenuOpen = ref(false);
const statusOptions = [
  { value: 'live', label: 'live' },
  { value: 'paused', label: 'paused' },
  { value: 'attention', label: 'attention' },
  { value: 'resolved', label: 'resolved' },
  { value: 'ended', label: 'ended' },
];
const statusLabel = computed(() => {
  if (!chat.value) return '';
  const map = {
    live: 'live',
    paused: 'paused',
    attention: 'attention',
    resolved: 'resolved',
    ended: 'ended',
    idle: 'idle',
  };
  return langStore.t(map[chat.value.status] || map.idle);
});
const headerStyle = computed(() => ({
  background: statusGradient(chat.value?.status || 'idle'),
}));
const statusMenuRef = ref(null);
function handleClickOutside(e) {
  if (statusMenuOpen.value && statusMenuRef.value && !statusMenuRef.value.contains(e.target)) {
    statusMenuOpen.value = false;
  }
}

async function fetchChat() {
  try {
    const res = await apiClient.get(`/chats/${chatId}`);
    chat.value = res.data;
    messages.value = res.data.messages || [];
    chatControl.value = res.data.control || 'agent';
  } catch (err) {
    console.error(err);
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  // Load initial chat data, agents and drafts sequentially.
  await fetchChat();
  await fetchAgents();
  await fetchDrafts();
  // Check if approval is required for this chat
  try {
    const r = await apiClient.get(`/chats/${chatId}/approve_mode`);
    approveRequired.value = !!(r.data && r.data.require);
  } catch {}
  // Presence: join and keepalive loop
  try {
    const user =
      JSON.parse(localStorage.getItem('auth.user') || sessionStorage.getItem('auth.user') || 'null') ||
      { id: 1, name: 'Operator' };
    await apiClient.post('/presence/enter', {
      chatId,
      userId: user.id,
      name: user.name || 'Operator',
    });
    presenceTimer = setInterval(async () => {
      try {
        await apiClient.post('/presence/enter', {
          chatId,
          userId: user.id,
          name: user.name || 'Operator',
        });
      } catch {}
    }, 15000);
  } catch {}
});

async function fetchAgents() {
  try {
    const res = await apiClient.get('/agents');
    agentsList.value = res.data;
  } catch (e) {
    console.error('Failed to fetch agents:', e);
  }
}

const assignedAgent = computed(() => {
  if (!agentsList.value || agentsList.value.length === 0) return null;
  if (chat.value && chat.value.agentId) {
    return agentsList.value.find((a) => a.id === chat.value.agentId) || null;
  }
  return agentsList.value[0] || null;
});

function messageAlignment(sender) {
  if (sender === 'client') return 'justify-start';
  if (sender === 'bot' || sender === 'operator') return 'justify-end';
  if (sender === 'system') return 'justify-center';
  return 'justify-start';
}
function messageBubbleClasses(sender) {
  if (sender === 'client') {
    return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg shadow';
  }
  if (sender === 'bot') {
    return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg shadow';
  }
  if (sender === 'operator') {
    return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg shadow';
  }
  if (sender === 'system') {
    return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 italic px-4 py-2 rounded-lg';
  }
  return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg';
}

function formatMessageTime(timeStr) {
  if (!timeStr) return '';
  if (/\d+:\d+/.test(timeStr)) {
    const date = new Date(`1970-01-01T${timeStr}`);
    if (!isNaN(date)) {
      const locale = langStore.current === 'ru' ? 'ru-RU' : 'en-US';
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
  }
  return timeStr;
}

async function sendMessage() {
  if (!newMessage.value.trim()) return;
  if (sendMode.value === 'approve') {
    try {
      await apiClient.post(`/chats/${chatId}/drafts`, { sender: 'agent', text: newMessage.value });
      showToast('Draft submitted for approval', 'success');
    } catch (e) {
      showToast('Failed to submit draft', 'error');
    }
    newMessage.value = '';
    await fetchChat();
    await fetchDrafts();
  try{ const r = await apiClient.get(`/chats/${chatId}/approve_mode`); approveRequired.value = !!(r.data && r.data.require); }catch{}
    return;
  }
  try {
    await apiClient.post(`/chats/${chatId}/messages`, {
      sender: 'operator',
      text: newMessage.value,
    });
    messages.value.push({
      sender: 'operator',
      text: newMessage.value,
      time: new Date().toLocaleTimeString(),
    });
    newMessage.value = '';
    showToast(langStore.t('messageSent'), 'success');
  } catch (e) {
    showToast(langStore.t('messageSendFailed'), 'error');
  }
}

let presenceTimer;
onBeforeUnmount(async () => {
  try {
    const user = JSON.parse(localStorage.getItem('auth.user') || sessionStorage.getItem('auth.user') || 'null') || { id: 1 };
    await apiClient.post('/presence/leave', { chatId, userId: user.id });
  } catch {}
  clearInterval(presenceTimer);
  document.removeEventListener('click', handleClickOutside);
});

async function interfere() {
  try {
    await apiClient.post(`/chats/${chatId}/interfere`);
    chatControl.value = 'operator';
    // status unchanged by interfere
    await fetchChat();
    await fetchDrafts();
  try{ const r = await apiClient.get(`/chats/${chatId}/approve_mode`); approveRequired.value = !!(r.data && r.data.require); }catch{}
    showToast(langStore.t('joinedChat'), 'success');
  } catch (e) {
    showToast(langStore.t('failedInterfere'), 'error');
  }
}

async function returnControl() {
  try {
    await apiClient.post(`/chats/${chatId}/return`);
  } catch {}
  chatControl.value = 'agent';
  // status unchanged by return
  showToast(langStore.t('controlReturned'), 'success');
}

async function setStatus(s) {
  statusMenuOpen.value = false;
  if (!chat.value) return;
  const prev = chat.value.status;
  chat.value.status = s;
  try {
    await apiClient.post(`/chats/${chatId}/status`, { status: s });
  } catch (e) {
    chat.value.status = prev;
    showToast(langStore.t('statusChangeFailed') || 'Status update failed', 'error');
  }
}

async function approveDraft(d) {
  try {
    await apiClient.post(`/chats/${chatId}/drafts/${d.id}/approve`);
    await fetchChat();
    await fetchDrafts();
  try{ const r = await apiClient.get(`/chats/${chatId}/approve_mode`); approveRequired.value = !!(r.data && r.data.require); }catch{}
  } catch {}
}
async function discardDraft(d) {
  try {
    await apiClient.delete(`/chats/${chatId}/drafts/${d.id}`);
    drafts.value = drafts.value.filter((x) => x.id !== d.id);
  } catch {}
}
async function simulateDraft() {
  try {
    const t = `Draft at ${new Date().toLocaleTimeString()}`;
    await apiClient.post(`/chats/${chatId}/drafts`, { sender: 'agent', text: t });
    await fetchDrafts();
  try{ const r = await apiClient.get(`/chats/${chatId}/approve_mode`); approveRequired.value = !!(r.data && r.data.require); }catch{}
  } catch {}
}

async function fetchDrafts() {
  try {
    const res = await apiClient.get(`/chats/${chatId}/drafts`);
    drafts.value = res.data || [];
  } catch {}
}



async function toggleApprove(e){
  const require = !!e.target.checked;
  try{ const r = await apiClient.patch(`/chats/${chatId}/approve_mode`, { require }); approveRequired.value = !!r.data.require; }catch{}
}

</script>

<style scoped>
.bg-secondary {
  background-color: var(--c-bg-secondary);
}
.text-muted {
  color: var(--c-text-secondary);
}
.border-default {
  border-color: var(--c-border);
}
.form-input {
  @apply w-full p-2.5 rounded-lg border;
  background-color: var(--c-bg-input, var(--c-bg-primary));
  border-color: var(--c-border);
}
.form-input:focus {
  @apply ring-2 border-transparent outline-none;
  --tw-ring-color: var(--c-text-brand);
}
</style>

<style scoped>
.chat-header {
  position: relative;
}
.chat-header::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 72px;
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--chat-grad-from) 35%, transparent),
    color-mix(in oklab, var(--chat-grad-to) 35%, transparent)
  );
  opacity: var(--chat-grad-opacity);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  pointer-events: none;
}
@media (prefers-reduced-motion: no-preference) {
  .chat-header::before {
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .chat-header:hover::before {
    opacity: calc(var(--chat-grad-opacity) + 0.04);
    transform: translateY(-1px);
  }
}
</style>