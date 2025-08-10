<template>
  <div class="flex flex-col h-full">
    <!-- Gradient header with controls -->
    <div class="chat-header shadow-sm" data-testid="chat-header-gradient" :style="headerStyle">
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
            {{ currentStatusLabel }}
          </span>
          <span
            v-if="slaActive"
            class="sla-chip ml-2"
            :class="slaClass"
            :aria-label="slaAria"
            aria-live="polite"
          >
            {{ slaText }}
          </span>
          <span
            v-if="chat?.assignedTo"
            class="assignee-chip ml-2"
            :aria-label="langStore.t('assign.assignedTo', { name: chat.assignedTo.name })"
          >
            {{ initials(chat.assignedTo.name) }}
          </span>
          <span v-else class="assignee-chip ml-2" aria-label="langStore.t('assign.unassigned')">
            {{ langStore.t('assign.unassigned') }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            data-testid="btn-change-status"
            aria-haspopup="menu"
            :aria-expanded="statusOpen"
            @click="openStatusMenu"
          >
            {{ langStore.t('controls.changeStatus') }}
          </Button>
          <Popover v-model:open="statusOpen" :anchor="statusAnchor" placement="bottom-end">
            <ul role="menu" class="w-40 rounded-md border border-default bg-secondary p-2">
              <li v-for="opt in statusOptions" :key="opt">
                <button
                  :data-testid="`status-item-${opt}`"
                  role="menuitem"
                  class="flex items-center w-full px-3 py-2 text-left hover-bg-effect"
                  @click="setStatus(opt)"
                >
                  <span
                    class="w-2 h-2 rounded-full mr-2"
                    :style="{ backgroundColor: statusColor(opt) }"
                    :aria-label="statusLabelFn(opt)"
                  ></span>
                  <span class="flex-1">{{ statusLabelFn(opt) }}</span>
                  <span v-if="chat?.status === opt" class="material-icons-outlined text-base ml-auto">check</span>
                </button>
              </li>
            </ul>
          </Popover>
          <ActionMenu :items="assignMenu">
            <Button variant="secondary" size="sm" data-testid="assign-menu-btn">⋮</Button>
          </ActionMenu>
          <StackedAvatars
            v-if="presenceStore.count(chatId)"
            :participants="presenceStore.getParticipants(chatId)"
            :overflow-text="langStore.t('presence.more')"
            :label="langStore.t('presence.participants')"
            testid="presence-stack-header"
          />
          <div v-if="devCitations" class="flex items-center gap-1 ml-2">
            <input type="checkbox" v-model="showCitations" class="h-3 w-3" />
            <span class="text-xs">{{ langStore.t('showCitations') }}</span>
          </div>
          <Button
            v-if="chat && !chat.snoozeUntil"
            variant="secondary"
            size="sm"
            @click="snooze(5)"
          >
            {{ langStore.t('snooze') }}
          </Button>
          <Button
            v-else-if="chat && chat.snoozeUntil"
            variant="secondary"
            size="sm"
            @click="unsnooze"
          >
            {{ langStore.t('unsnooze') }}
          </Button>
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
          <span class="text-xs block mt-1 flex items-center gap-1">
            {{ formatMessageTime(msg.time) }}
            <TokenBadge v-if="msg.tokenUsage" :count="msg.tokenUsage.totalTokens" />
          </span>
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
        <Button
          v-if="!inputEnabled"
          data-testid="btn-interfere"
          class="mr-3"
          :disabled="!canInterfere"
          :title="!canInterfere ? langStore.t('assign.cannotInterfere', { name: chat?.assignedTo?.name }) : ''"
          variant="primary"
          size="sm"
          @click="interfere"
        >
          {{ langStore.t('controls.interfere') }}
        </Button>
        <Button
          v-else
          data-testid="btn-return"
          class="mr-3"
          variant="secondary"
          size="sm"
          @click="returnControl"
        >
          {{ langStore.t('controls.return') }}
        </Button>
        <input
          v-model="newMessage"
          type="text"
          data-testid="composer-input"
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
      <div class="text-xs text-muted" data-testid="composer-estimate">
        {{ langStore.t('tokens.estimate', { count: draftEstimate }) }}
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
import { statusColor, badgeColor, statusGradient, statusLabel as statusLabelFn } from './chatsUtils.js';
import { setStatus as setChatStatus } from '@/api/chats.js';
import { chatStore } from '@/stores/chatStore.js';
import usageStore from '@/stores/usageStore.js'
import { estimateTokensForText } from '@/utils/tokenEstimate.js'
import TokenBadge from '@/components/TokenBadge.vue'
import StackedAvatars from '@/components/StackedAvatars.vue'
import { settingsStore } from '@/stores/settingsStore.js';
import { typingStore } from '@/stores/typingStore.js';
import { outboxStore } from '@/stores/outboxStore.js';
import { composerStore } from '@/stores/composerStore.js';
import { typingText } from '@/utils/typing.js';
import ActionMenu from '@/components/ui/ActionMenu.vue';
import { presenceStore } from '@/stores/presenceStore.js';
import Popover from '@/components/ui/Popover.vue';

const devCitations = import.meta.env.DEV;
const showCitations = ref(true);
const currentUser =
  JSON.parse(localStorage.getItem('auth.user') || sessionStorage.getItem('auth.user') || 'null') ||
  { id: 1 };
const busyByOthers = computed(() =>
  presenceStore.getParticipants(chatId).some((p) => p.id !== currentUser.id)
);
const canInterfere = computed(
  () => chat.value && chatStore.canInterfere(chat.value, currentUser.id) && !busyByOthers.value
);
const assignMenu = computed(() => {
  const items = [];
  if (chat.value) {
    if (!chat.value.assignedTo) {
      items.push({ id: 'claim', labelKey: 'assign.claim', onSelect: () => chatStore.claim(chat.value.id, currentUser) });
    } else if (chatStore.isAssignedToMe(chat.value, currentUser.id)) {
      items.push({ id: 'unassign', labelKey: 'assign.unassign', onSelect: () => chatStore.unassign(chat.value.id) });
    }
    items.push({
      id: 'transfer',
      labelKey: 'assign.transfer',
      onSelect: () => {
        const target = presenceStore.state.operators.find((o) => o.id !== currentUser.id);
        if (target) chatStore.transfer(chat.value.id, target);
      },
    });
  }
  return items;
});
const messages = ref([]);
watch(messages, (arr, prev) => {
  if (arr.length > prev.length) {
    const msg = arr[arr.length - 1];
    if (msg.sender === 'agent' && !msg.tokenUsage) {
      const outputTokens = estimateTokensForText(msg.text);
      const inputTokens = 0;
      msg.tokenUsage = {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      };
      usageStore.record({
        chatId,
        agentId: chat.value?.agentId,
        messageId: `m_${Date.now()}`,
        direction: 'agent',
        inputTokens,
        outputTokens,
      });
    }
  }
});
const messagesContainer = ref(null);
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
const draftEstimate = computed(() => estimateTokensForText(newMessage.value));
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
    : langStore.t('composer.placeholder.locked')
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

const statusOptions = ['live', 'attention', 'paused', 'resolved', 'ended'];
const statusOpen = ref(false);
const statusAnchor = ref(null);
function openStatusMenu(e) {
  statusAnchor.value = e.currentTarget;
  statusOpen.value = true;
}
const currentStatusLabel = computed(() => statusLabelFn(chat.value?.status || 'idle'));
function statusAria(s) {
  return statusLabelFn(s);
}

const slaMinutes = computed(() => settingsStore.state.workspaceSettings.attentionSLA);
const slaRemaining = computed(() => {
  chatStore.slaTick.value;
  return chat.value ? chatStore.getSlaRemainingMs(chat.value, slaMinutes.value) : 0;
});
const slaText = computed(() => chatStore.formatSla(slaRemaining.value));
const slaActive = computed(() => (chat.value ? chatStore.isSlaActive(chat.value) : false));
const slaClass = computed(() => {
  const ms = slaRemaining.value;
  if (chat.value?.slaBreached || ms === 0) return 'danger';
  if (ms <= 60_000) return 'warning';
  return 'neutral';
});
const slaAria = computed(() => langStore.t('sla.remaining', { time: slaText.value }));

function snooze(minutes) {
  if (!chat.value) return
  chatStore.snoozeChat(chat.value, minutes)
}

function unsnooze() {
  if (!chat.value) return
  chatStore.unsnoozeChat(chat.value)
}
const headerStyle = computed(() => ({
  '--header-gradient': statusGradient(chat.value?.status || 'idle'),
}));

const typingLine = computed(() => {
  const ids = typingStore.getTyping(chatId).filter((id) => id !== currentUser.id);
  const names = ids
    .map((id) => presenceStore.getParticipants(chatId).find((p) => p.id === String(id))?.name)
    .filter(Boolean);
  if (typingStore.isAgentDrafting(chatId)) return langStore.t('agentDrafting');
  return typingText(names);
});

async function fetchChat() {
  try {
    const res = await apiClient.get(`/chats/${chatId}`);
    chat.value = res.data;
    chatStore.updateChat(res.data);
    chatStore.handleStatusChange(chat.value, chat.value.status);
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
  await fetchChat();
  await fetchAgents();
  await fetchDrafts();
  await presenceStore.hydrate([chatId]);
  await presenceStore.join(chatId, currentUser);
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

onBeforeUnmount(() => {
  presenceStore.leave(chatId, currentUser);
});

async function interfere() {
  try {
    await chatStore.interfere(chatId, currentUser)
    await fetchChat()
    await fetchDrafts()
    showToast(langStore.t('joinedChat'), 'success')
  } catch (e) {
    if (e.message === 'ERR_ASSIGNED') {
      showToast(langStore.t('assign.cannotInterfere', { name: chat.value?.assignedTo?.name }), 'error')
    } else {
      showToast(langStore.t('failedInterfere'), 'error')
    }
  }
}

async function returnControl() {
  await chatStore.returnToAgentAction(chatId)
  await fetchDrafts()
  showToast(langStore.t('controlReturned'), 'success')
}

async function setStatus(s) {
  if (!chat.value) return;
  const prev = chat.value.status;
  try {
    await setChatStatus(chatId, s);
    chat.value.status = s;
  } catch {
    showToast(langStore.t('statusChangeFailed') || 'Status update failed', 'error');
    return;
  }
  chatStore.handleStatusChange(chat.value, prev);
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
.sla-chip {
  padding: 0 0.25rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}
.sla-chip.warning {
  background-color: var(--status-color-paused);
}
.sla-chip.danger {
  background-color: var(--status-color-attention);
  color: #fff;
}
.assignee-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  background-color: var(--c-bg-tertiary, #e5e7eb);
  font-size: 0.75rem;
  font-weight: 600;
}
.chat-header {
  position: relative;
}
.chat-header::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 56px;
  background: var(--header-gradient);
  opacity: var(--chatHeaderGradientOpacity);
  pointer-events: none;
}
</style>