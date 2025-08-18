<template>
  <div class="flex flex-col h-full">
    <header
      class="flex items-center h-14 px-4 text-sm text-white"
      :style="headerStyle"
    >
      <h2 class="text-lg font-semibold flex-1">
        {{ chat?.title }}
      </h2>
      <span class="ml-2">Operators / Операторы: {{ chat?.presence.operators.length || 0 }}</span>
      <span v-if="draftCount" class="ml-2">Pending drafts: {{ draftCount }} / Черновики: {{ draftCount }}</span>
    </header>
    <div class="flex-1 overflow-y-auto border p-2 mb-2">
      <div v-for="m in messages" :key="m.id" class="mb-2">
        <div
          :class="[
            'px-2 py-1 rounded max-w-xl',
            m.role === 'client' ? 'bg-blue-100' : m.role === 'agent' ? 'bg-green-100' : 'bg-gray-100',
            m.draft ? 'opacity-60' : ''
          ]"
        >
          <span v-if="m.draft" class="text-xs mr-1">Draft / Черновик:</span>{{ m.text }}
          <span v-if="m.role === 'agent' && m.deliveredAt" class="text-xs ml-1">✓</span>
        </div>
        <div v-if="canApprove(m)" class="mt-1 flex gap-2 text-xs">
          <button @click="approve(m)" class="bg-green-500 text-white px-2 py-0.5">
            Approve / Отправить
          </button>
          <button @click="discard(m)" class="bg-red-500 text-white px-2 py-0.5">
            Discard / Отклонить
          </button>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <select v-model="mode" class="border px-2 py-1">
        <option value="client">Client / Клиент</option>
        <option value="agent">Agent / Агент</option>
      </select>
      <input
        v-model="text"
        class="flex-1 border px-2 py-1"
        :disabled="sendDisabled"
        placeholder="Message / Сообщение"
      />
      <button @click="send" :disabled="sendDisabled" class="bg-blue-500 text-white px-3 py-1">
        Send / Отправить
      </button>
    </div>
    <div v-if="mode === 'agent'" class="text-xs text-gray-500 mt-1">
      ~{{ tokenEstimate }} tokens
      <span v-if="billing.tokenBalance <= 0" class="text-red-500 ml-2">
        <RouterLink to="/billing" class="underline">Add tokens / Пополнить</RouterLink>
      </span>
    </div>
    <div class="flex gap-2 mt-2">
      <button v-if="showReturn" @click="returnControl" class="bg-gray-500 text-white px-3 py-1">
        Return to agent / Вернуть агенту
      </button>
      <button v-else @click="takeControl" :disabled="chat?.control.mode === 'operator'" class="bg-gray-500 text-white px-3 py-1">
        Interfere / Вмешаться
      </button>
    </div>
    <div v-if="blocked" class="text-sm text-gray-500 mt-1">
      Controlled by {{ chat?.control.ownerUserId }} / Под контролем {{ chat?.control.ownerUserId }}
    </div>
    <div class="mt-2">
      <label class="mr-2">Status / Статус:</label>
      <select v-model="status" @change="changeStatus" class="border px-2 py-1">
        <option value="live">Live / В эфире</option>
        <option value="paused">Paused / Пауза</option>
        <option value="attention">Requires attention / Требует внимания</option>
        <option value="resolved">Resolved / Решён</option>
        <option value="ended">End chat / Завершён</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useChatsStore } from '@/stores/chats';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/toast';
import { statusTheme } from '@/utils/statusTheme';
import { useBillingStore } from '@/stores/billingStore';
import { estimateTokens } from '@/utils/tokens';

const store = useChatsStore();
const auth = useAuthStore();
const route = useRoute();
const mode = ref<'client' | 'agent'>('client');
const text = ref('');
const status = ref('');
const chatId = computed(() => route.params.id as string);
const billing = useBillingStore();

const messages = computed(() => store.transcript[chatId.value]?.items || []);
const chat = computed(() => store.byId[chatId.value]);

const draftCount = computed(() => messages.value.filter((m) => m.draft && !m.discardedAt).length);

const headerStyle = computed(() => statusTheme(chat.value?.status));

const blocked = computed(() => {
  const c = chat.value;
  if (!c) return true;
  if (auth.user?.role === 'operator' || auth.user?.role === 'owner') {
    if (c.control.mode === 'operator' && c.control.ownerUserId !== auth.user.id) return true;
  }
  return false;
});

const sendDisabled = computed(() => blocked.value || (mode.value === 'agent' && billing.tokenBalance <= 0));
const tokenEstimate = computed(() => (mode.value === 'agent' ? estimateTokens(text.value) : 0));

const showReturn = computed(
  () => chat.value?.control.mode === 'operator' && chat.value.control.ownerUserId === auth.user?.id,
);

async function load(id: string) {
  await store.getChat(id);
  await store.joinPresence(id);
  status.value = chat.value?.status || '';
  await store._pollOnce(id);
  store.startPolling(id);
}

function send() {
  const t = text.value.trim();
  if (!t) return;
  store.sendMessage(chatId.value, { role: mode.value, text: t });
  text.value = '';
}

function canApprove(m: any) {
  if (!m.draft || m.discardedAt) return false;
  const c = chat.value;
  if (!c) return false;
  if (c.control.mode === 'operator') return c.control.ownerUserId === auth.user?.id;
  return auth.user?.role === 'operator' || auth.user?.role === 'owner';
}

async function approve(m: any) {
  try {
    await store.approveDraft(chatId.value, m.id);
    showToast('Sent to client / Отправлено клиенту');
  } catch {
    showToast('Approve failed / Не удалось отправить', 'error');
  }
}

async function discard(m: any) {
  try {
    await store.discardDraft(chatId.value, m.id);
    showToast('Draft removed / Черновик удалён');
  } catch {
    showToast('Discard failed / Не удалось удалить', 'error');
  }
}

function takeControl() {
  store.interfere(chatId.value);
}

function returnControl() {
  store.returnToAgent(chatId.value);
}

async function changeStatus() {
  try {
    await store.updateChat(chatId.value, { status: status.value });
  } catch {
    showToast('Status update failed / Не удалось изменить статус', 'error');
  }
}

watch(chatId, (n, o) => {
  if (o) {
    store.stopPolling(o as string);
    store.leavePresence(o as string);
  }
  load(n);
});

onMounted(() => load(chatId.value));
onUnmounted(() => {
  store.stopPolling(chatId.value);
  store.leavePresence(chatId.value);
});
</script>

