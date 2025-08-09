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
              :aria-label="statusAria(chat.status)"
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
          <div class="relative" ref="statusMenuRoot">
            <Button
              ref="statusMenuButton"
              variant="secondary"
              size="sm"
              data-testid="status-menu-btn"
              :aria-expanded="statusMenuOpen"
              aria-controls="status-menu"
              @click="toggleStatusMenu"
            >
              {{ langStore.t('changeStatus') }}
            </Button>
            <ul
              v-if="statusMenuOpen"
              id="status-menu"
              role="menu"
              data-testid="status-menu"
              class="absolute left-full top-0 ml-1 w-40 rounded-md border border-default bg-secondary z-10"
              @keydown="onStatusMenuKeydown"
            >
              <li v-for="(opt, idx) in statusOptions" :key="opt.value">
                <button
                  :ref="el => statusMenuItems[idx] = el"
                  role="menuitem"
                  class="flex items-center w-full px-3 py-2 text-left hover-bg-effect"
                  :aria-label="langStore.t(`setStatus${opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}`)"
                  @click="selectStatus(idx)"
                >
                  <span
                    class="w-2 h-2 rounded-full mr-2"
                    :style="{ backgroundColor: statusColor(opt.value) }"
                  ></span>
                  <span class="flex-1">{{ langStore.t(opt.label) }}</span>
                  <span v-if="chat?.status === opt.value" class="material-icons-outlined text-base ml-auto">check</span>
                </button>
              </li>
            </ul>
          </div>
          <div v-if="displayAvatars.length" class="flex -space-x-2 items-center" data-testid="presence-stack">
            <button
              v-for="p in displayAvatars"
              :key="p.userId"
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800"
              :style="{ backgroundColor: p.color }"
              :title="p.name"
              :aria-label="`${langStore.t('present')}: ${p.name}`"
            >
              <img v-if="p.avatar" :src="p.avatar" alt="" class="w-full h-full rounded-full" />
              <span v-else>{{ p.initials }}</span>
            </button>
            <div
              v-if="extraCount > 0"
              class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs flex items-center justify-center font-medium border-2 border-white dark:border-gray-800"
              :title="extraNames"
              :aria-label="langStore.t('moreParticipants')"
            >
              +{{ extraCount }}
            </div>
          </div>
          <div v-if="devCitations" class="flex items-center gap-1 ml-2">
            <input type="checkbox" v-model="showCitations" class="h-3 w-3" />
            <span class="text-xs">{{ langStore.t('showCitations') }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Typing indicator -->
    <div aria-live="polite" class="text-center text-sm text-muted h-5">{{ typingLine }}</div>
    <!-- Messages list -->
    <div ref="messagesContainer" class="flex-1 p-6 overflow-y-auto space-y-4 bg-secondary">
      <!-- Drafts panel -->
      <div v-if="drafts.length" class="mb-3 rounded-lg border border-default bg-white/5">
        <div
          class="flex items-center justify-between px-3 py-2 cursor-pointer"
          @click="draftsExpanded = !draftsExpanded"
        >
          <strong>{{ langStore.t('drafts') }} ({{ drafts.length }})</strong>
          <div class="flex items-center gap-2" v-if="draftsExpanded">
            <Button
              variant="primary"
              size="sm"
              :disabled="chatStore.state.isBulkSubmitting"
              @click.stop="sendAllDrafts"
            >
              {{ langStore.t('sendAll') }}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              :disabled="chatStore.state.isBulkSubmitting"
              @click.stop="rejectAllDrafts"
            >
              {{ langStore.t('rejectAll') }}
            </Button>
          </div>
        </div>
        <div v-if="draftsExpanded">
          <div
            v-for="d in drafts"
            :key="d.id"
            class="border-t border-default p-3"
          >
            <div v-if="editingDraft && editingDraft.id === d.id">
              <textarea v-model="editBody" class="form-input w-full mb-2"></textarea>
              <div class="flex gap-2">
                <Button variant="primary" size="sm" @click="submitEdit">{{ langStore.t('editAndSend') }}</Button>
                <Button variant="secondary" size="sm" @click="cancelEdit">{{ langStore.t('cancel') }}</Button>
              </div>
            </div>
            <div v-else class="flex items-center justify-between">
              <span class="text-sm max-w-xs truncate">{{ d.body || d.text }}</span>
              <div class="flex gap-2">
                <Button variant="primary" size="sm" @click="approveDraft(d)">{{ langStore.t('approveAndSend') }}</Button>
                <Button variant="secondary" size="sm" @click="startEdit(d)">{{ langStore.t('editAndSend') }}</Button>
                <Button variant="secondary" size="sm" @click="rejectDraft(d)">{{ langStore.t('reject') }}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Placeholder when no chat selected -->
      <div v-if="!chat" class="text-center text-muted mt-10">
        {{ langStore.t('selectChat') }}
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
          <span v-if="msg.outbox" class="text-xs block mt-1">
            {{ statusLabelMsg(msg.outbox.status) }}
            <button
              v-if="msg.outbox.status === 'failed'"
              class="underline ml-2"
              @click="outboxStore.enqueue(chatId, msg.text)"
            >
              {{ langStore.t('retry') }}
            </button>
          </span>
        </div>
      </div>
    </div>
    <!-- Composer and actions -->
    <div class="p-4 border-t border-default bg-secondary">
      <div v-if="outboxStore.state.isOffline" class="text-center text-xs mb-2" data-testid="offline-banner">
        {{ langStore.t('offlineBanner') }}
      </div>
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
        <div class="flex items-center gap-2">
          <span v-if="savedTime" class="text-xs text-muted">{{ langStore.t('savedAt', { time: savedTime }) }}</span>
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
  </div>
</template>

<script setup>
import Button from '@/components/ui/Button.vue';
import { ref, onMounted, computed, onBeforeUnmount, watch, nextTick } from 'vue';
import langStore from '@/stores/langStore.js';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/api';
import { showToast } from '@/stores/toastStore';
import {
  statusColor,
  badgeColor,
  statusGradient,
  computePresenceDisplay,
  updateChatStatus,
} from './chatsUtils.js';
import { useStatusMenu } from './statusMenu.js';
import { chatStore } from '@/stores/chatStore.js';
import { typingStore } from '@/stores/typingStore.js';
import { outboxStore } from '@/stores/outboxStore.js';
import { composerStore } from '@/stores/composerStore.js';
import { typingText } from '@/utils/typing.js';


const presenceList = ref([]);
const devCitations = import.meta.env.DEV;
const showCitations = ref(true);
const currentUser =
  JSON.parse(localStorage.getItem('auth.user') || sessionStorage.getItem('auth.user') || 'null') ||
  { id: 1 };
async function refreshPresence() {
  try {
    const res = await apiClient.get('/presence');
    const list = res.data[String(chatId)] || [];
    presenceList.value = list;
  } catch {}
}
const busyByOthers = computed(() => presenceList.value.some((p) => p.userId !== currentUser.id));
function avatarColor(id) {
  const num = typeof id === 'number' ? id : Array.from(String(id)).reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = (num * 47) % 360;
  return `hsl(${hue},70%,55%)`;
}
const presenceDisplay = computed(() => computePresenceDisplay(presenceList.value, currentUser.id));
const displayAvatars = computed(() =>
  presenceDisplay.value.visible.map((p) => ({
    ...p,
    initials: (p.name || '?')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    color: avatarColor(p.userId),
  })),
);
const extraCount = computed(() => presenceDisplay.value.extra);
const extraNames = computed(() => presenceDisplay.value.others.map((p) => p.name).join(', '));
const messages = ref([]);
const messagesContainer = ref(null);
let presenceInterval;
watch(messages, () => {
  nextTick(() => {
    const el = messagesContainer.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
});
const route = useRoute();
const router = useRouter();
const chatId = route.params.id;

const chat = ref(null);
const newMessage = ref('');
const savedAt = ref(null);
const drafts = computed(() => chatStore.state.drafts[chatId] || []);
const draftsExpanded = ref(false);
watch(
  () => drafts.value.length,
  (len) => {
    if (len > 0) draftsExpanded.value = true;
  },
  { immediate: true },
);
let typingNotify;
function onType() {
  if (!inputEnabled.value) return;
  typingStore.startTyping(chatId, currentUser.id);
  clearTimeout(typingNotify);
  typingNotify = setTimeout(() => {
    apiClient.post(`/chats/${chatId}/typing`).catch(() => {});
  }, 0);
}
// control state
const chatControl = computed(() => chatStore.state.chatControl[chatId] || 'agent');
const inputEnabled = computed(() => chatControl.value === 'operator');
// Agents list for resolving assigned agent names
const agentsList = ref([]);
const subtitle = computed(() => (chat.value ? `ID: ${chatId}` : ''));

const placeholderText = computed(() =>
  inputEnabled.value
    ? langStore.t('operatorInControl')
    : langStore.t('agentInControl')
);

const saveTimer = ref(null);
const savedTime = computed(() => (savedAt.value ? new Date(savedAt.value).toLocaleTimeString() : null));
watch(newMessage, () => {
  clearTimeout(saveTimer.value);
  saveTimer.value = setTimeout(() => {
    composerStore.save(chatId, newMessage.value);
    savedAt.value = Date.now();
  }, 400);
});

const statusOptions = [
  { value: 'live', label: 'live' },
  { value: 'paused', label: 'paused' },
  { value: 'attention', label: 'attention' },
  { value: 'resolved', label: 'resolved' },
  { value: 'ended', label: 'ended' },
];
const statusMenu = useStatusMenu(statusOptions, (v) => setStatus(v));
const statusMenuOpen = statusMenu.open;
const toggleStatusMenu = statusMenu.toggle;
const onStatusMenuKeydown = statusMenu.onKeydown;
const statusMenuButton = statusMenu.triggerRef;
const statusMenuRoot = statusMenu.menuRef;
const statusMenuItems = statusMenu.itemRefs;
const selectStatus = statusMenu.select;
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
function tStatus(s) {
  if (!s) return ''
  const key = `status${s.charAt(0).toUpperCase() + s.slice(1)}`
  return langStore.t(key)
}
function statusAria(s) {
  return `${langStore.t('statusLabel')}: ${tStatus(s)}`
}
const headerStyle = computed(() => ({
  background: statusGradient(chat.value?.status || 'idle'),
}));

const typingLine = computed(() => {
  const ids = typingStore.getTyping(chatId).filter((id) => id !== currentUser.id);
  const names = ids
    .map((id) => presenceList.value.find((p) => p.userId === Number(id))?.name)
    .filter(Boolean);
  if (typingStore.isAgentDrafting(chatId)) return langStore.t('agentDrafting');
  return typingText(names);
});

async function fetchChat() {
  try {
    const res = await apiClient.get(`/chats/${chatId}`);
    chat.value = res.data;
    messages.value = res.data.messages || [];
    chatStore.setControl(chatId, res.data.control || 'agent');
    const draft = composerStore.get(chatId);
    if (draft) {
      newMessage.value = draft.body;
      savedAt.value = draft.updatedAt;
    }
  } catch (err) {
    console.error(err);
  }
}

onMounted(async () => {
  document.addEventListener('click', statusMenu.onDocumentClick);
  await fetchChat();
  await fetchAgents();
  await fetchDrafts();
  await refreshPresence();
  presenceInterval = setInterval(refreshPresence, 2000);
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
  const body = newMessage.value.trim();
  const msgRef = outboxStore.enqueue(chatId, body);
  messages.value.push({
    sender: 'operator',
    text: body,
    time: new Date().toLocaleTimeString(),
    outbox: msgRef,
  });
  newMessage.value = '';
  composerStore.remove(chatId);
  savedAt.value = null;
}

let presenceTimer;
onBeforeUnmount(async () => {
  try {
    const user = JSON.parse(localStorage.getItem('auth.user') || sessionStorage.getItem('auth.user') || 'null') || { id: 1 };
    await apiClient.post('/presence/leave', { chatId, userId: user.id });
  } catch {}
  clearInterval(presenceTimer);
  clearInterval(presenceInterval);
  document.removeEventListener('click', statusMenu.onDocumentClick);
});

async function interfere() {
  try {
    await apiClient.post(`/chats/${chatId}/interfere`);
    chatStore.setControl(chatId, 'operator');
    await fetchChat();
    await fetchDrafts();
    showToast(langStore.t('joinedChat'), 'success');
  } catch (e) {
    showToast(langStore.t('failedInterfere'), 'error');
  }
}

async function returnControl() {
  try {
    await apiClient.post(`/chats/${chatId}/return`);
  } catch {}
  chatStore.setControl(chatId, 'agent');
  await fetchDrafts();
  showToast(langStore.t('controlReturned'), 'success');
}

async function setStatus(s) {
  if (!chat.value) return;
  await updateChatStatus(chat.value, s, apiClient, showToast, langStore.t);
}
async function fetchDrafts() {
  await chatStore.fetchDrafts(chatId);
}

function approveDraft(d) {
  chatStore.approveDraft(chatId, d.id);
}

function rejectDraft(d) {
  chatStore.rejectDraft(chatId, d.id);
}

const editingDraft = ref(null);
const editBody = ref('');
function startEdit(d) {
  editingDraft.value = d;
  editBody.value = d.body || d.text || '';
}
async function submitEdit() {
  if (!editingDraft.value) return;
  await chatStore.editAndSend(chatId, editingDraft.value.id, editBody.value);
  editingDraft.value = null;
  editBody.value = '';
}
function cancelEdit() {
  editingDraft.value = null;
  editBody.value = '';
}

function sendAllDrafts() {
  if (window.confirm(langStore.t('confirmSendAllBody'))) {
    chatStore.sendAll(chatId);
  }
}

function rejectAllDrafts() {
  if (window.confirm(langStore.t('confirmRejectAllBody'))) {
    chatStore.rejectAll(chatId);
  }
}

function statusLabelMsg(s) {
  if (s === 'failed') return langStore.t('failed');
  if (s === 'sent') return langStore.t('sent');
  return langStore.t('sending');
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