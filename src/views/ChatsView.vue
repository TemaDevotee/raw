<template>
  <div class="flex h-full">
    <!-- Left column: chat list with search/filter and groups -->
    <div class="w-full max-w-md border-r border-default flex flex-col">
      <PageHeader :title="langStore.t('chats')" />

      <!-- Search and filter controls -->
      <div
        class="px-6 pb-4 flex flex-wrap items-center gap-3 sticky top-0 z-10 bg-secondary/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
      >
        <input
          v-model="searchQuery"
          :placeholder="langStore.t('selectChat')"
          class="flex-1 min-w-[8rem] px-4 py-2 rounded-full border border-default bg-input text-default placeholder:text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-text-brand)]"
        />
        <select
          v-model="selectedStatus"
          class="w-40 sm:w-48 px-4 py-2 rounded-full border border-default bg-input text-default shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-text-brand)]"
        >
          <option value="">{{ langStore.t('all') || 'All' }}</option>
          <option value="attention">{{ langStore.t('attention') }}</option>
          <option value="live">{{ langStore.t('live') }}</option>
          <option value="paused">{{ langStore.t('paused') }}</option>
          <option value="resolved">{{ langStore.t('resolved') }}</option>
          <option value="idle">{{ langStore.t('idle') }}</option>
        </select>
      </div>

      <SkeletonLoader v-if="isLoading" class="flex-1" />
      <VirtualList
        v-else
        class="flex-1 border-t border-default"
        :items="virtualItems"
        :item-height="ITEM_HEIGHT"
      >
        <template #default="{ item }">
          <div v-if="item.type === 'header'" class="border-t border-default">
            <button
              class="w-full flex justify-between items-center px-6 py-3 text-sm font-medium text-default hover:bg-hover focus:outline-none"
              @click="toggleGroup(item.status)"
              :aria-expanded="isGroupOpen(item.status).toString()"
            >
              <span class="uppercase text-xs tracking-wide">
                {{ statusLabel(item.status) }} ({{ groupedChats[item.status].length }})
              </span>
              <span
                class="material-icons transition-transform duration-300 ease-in-out"
                :class="{ 'rotate-180': isGroupOpen(item.status) }"
                >expand_more</span
              >
            </button>
            <div v-if="isGroupOpen(item.status) && groupedChats[item.status].length === 0" class="px-6 py-4 text-xs text-muted">
              {{ langStore.t('noChats') }}
            </div>
          </div>
          <div
            v-else
            @click="goToChat(item.chat.id)"
            @keydown.enter="goToChat(item.chat.id)"
            role="button"
            tabindex="0"
            :class="['chat-item group', { active: String(route.params.id) === String(item.chat.id) }]"
            :style="{ '--status-color': statusColor(item.chat.status) }"
          >
            <span
              class="status-dot mr-3"
              :style="{ backgroundColor: statusColor(item.chat.status) }"
              :aria-label="statusAria(item.chat.status)"
            ></span>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-default truncate">
                {{ item.chat.clientName }}
              </p>
              <p class="text-xs text-muted truncate">
                {{ item.chat.lastMessage }}
              </p>
            </div>
            <div class="flex items-center space-x-2">
              <span
                v-if="presenceCount(item.chat.id)"
                class="presence-badge"
                :style="{ backgroundColor: badgeColor(item.chat.status) }"
                >{{ presenceCount(item.chat.id) }}</span
              >
              <span class="text-xs text-muted">{{ formatChatTime(item.chat.time) }}</span>
            </div>
          </div>
        </template>
      </VirtualList>
    </div>

    <!-- Right column: chat window (router-view) -->
    <div class="flex-1">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import apiClient from '@/api';
import PageHeader from '@/components/PageHeader.vue';
import VirtualList from '@/components/VirtualList.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import langStore from '@/stores/langStore';
import {
  statusColor,
  badgeColor,
  chatTimestamp,
  GROUPS_KEY,
  presenceCount as utilPresenceCount,
} from './chatsUtils.js';

const router = useRouter();
const route = useRoute();

// raw chat data
const chats = ref([]);
const isLoading = ref(true);

// search & filter
const searchQuery = ref('');
const liveSearch = ref('');
let searchTimer;
watch(searchQuery, (v) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => (liveSearch.value = v), 200);
});
const selectedStatus = ref('');

// presence map
const presenceMap = ref({});

async function refreshPresence() {
  try {
    const res = await apiClient.get('/presence');
    presenceMap.value = res.data || {};
  } catch {
    // ignore
  }
}

let presenceTimer;

async function fetchChats() {
  try {
    const res = await apiClient.get('/chats');
    chats.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
  isLoading.value = false;
}

onMounted(async () => {
  await fetchChats();
  await refreshPresence();
  presenceTimer = setInterval(refreshPresence, 2000);
  restoreGroups();
});

onBeforeUnmount(() => {
  clearInterval(presenceTimer);
});

// filtering
const filteredChats = computed(() => {
  const q = liveSearch.value.trim().toLowerCase();
  return chats.value.filter((c) => {
    const matchSearch =
      !q ||
      c.clientName.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q);
    const matchStatus = !selectedStatus.value || c.status === selectedStatus.value;
    return matchSearch && matchStatus;
  });
});

// grouping & sorting
const groupOrder = ['live', 'attention', 'paused', 'resolved', 'idle'];
const groupedChats = computed(() => {
  const groups = {
    live: [],
    attention: [],
    paused: [],
    resolved: [],
    idle: [],
  };
  filteredChats.value.forEach((chat) => {
    let key = chat.status === 'ended' ? 'idle' : chat.status;
    if (key === 'attention' && chat.snoozeUntil && Date.parse(chat.snoozeUntil) > Date.now()) {
      key = 'paused';
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(chat);
  });
  Object.keys(groups).forEach((k) => {
    groups[k].sort((a, b) => chatTimestamp(b) - chatTimestamp(a));
  });
  return groups;
});

const ITEM_HEIGHT = 64;
const virtualItems = computed(() => {
  const items = [];
  for (const status of groupOrder) {
    items.push({ type: 'header', status, key: `h-${status}` });
    if (isGroupOpen(status)) {
      const list = groupedChats.value[status];
      if (list.length === 0) {
        // placeholder for empty group so skeleton keeps space
        // handled in template
      } else {
        for (const chat of list) {
          items.push({ type: 'chat', chat, key: `c-${chat.id}` });
        }
      }
    }
  }
  return items;
});

// collapsible groups state
// key for session storage (imported)
const openGroups = ref({});

function restoreGroups() {
  try {
    const saved = sessionStorage.getItem(GROUPS_KEY);
    if (saved) openGroups.value = JSON.parse(saved);
  } catch {
    // ignore
  }
}

function persistGroups() {
  try {
    sessionStorage.setItem(GROUPS_KEY, JSON.stringify(openGroups.value));
  } catch {
    // ignore
  }
}

function toggleGroup(status) {
  openGroups.value[status] = !isGroupOpen(status);
  persistGroups();
}

function isGroupOpen(status) {
  return openGroups.value[status] !== false;
}

// helpers
function tStatus(s) {
  if (!s) return ''
  const key = `status${s.charAt(0).toUpperCase() + s.slice(1)}`
  return langStore.t(key)
}
function statusLabel(status) {
  return tStatus(status)
}
function statusAria(status) {
  return `${langStore.t('statusLabel')}: ${tStatus(status)}`
}

function presenceCount(id) {
  return utilPresenceCount(presenceMap.value, id);
}

function goToChat(id) {
  router.push(`/chats/${id}`);
}

// time formatting for display
function formatChatTime(timeStr) {
  if (!timeStr) return '';
  const normalized = String(timeStr).trim().toLowerCase();
  if (normalized === 'now' || normalized === 'just now') {
    return langStore.t('nowLabel');
  }
  const match = normalized.match(/^(\d+)([mhd])(?:\s*ago)?$/);
  if (match) {
    const n = Number(match[1]);
    const unit = match[2];
    if (unit === 'm') {
      const word = n === 1 ? langStore.t('minute') : langStore.t('minutes');
      return `${n} ${word}`;
    } else if (unit === 'h') {
      const word = n === 1 ? langStore.t('hour') : langStore.t('hours');
      return `${n} ${word}`;
    } else if (unit === 'd') {
      const word = n === 1 ? langStore.t('day') || 'day' : langStore.t('days') || 'days';
      return `${n} ${word}`;
    }
  }
  return timeStr;
}
</script>

<style scoped>
.chat-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-left: 2px solid transparent;
}
.chat-item:hover {
  background-color: var(--c-bg-hover);
}
.chat-item.active {
  background-color: var(--c-bg-hover);
  border-left-color: var(--status-color);
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}
.presence-badge {
  font-size: 10px;
  line-height: 1;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  color: currentColor;
}
.bg-input {
  background-color: var(--c-bg-secondary);
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
.accordion-enter-to,
.accordion-leave-from {
  max-height: 1000px;
  opacity: 1;
}
.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}
</style>

