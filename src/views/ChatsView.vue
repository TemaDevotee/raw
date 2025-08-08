<template>
  <div class="flex h-full">
    <!-- Left column: chat list with search/filter and groups -->
    <div class="w-full max-w-md border-r border-default flex flex-col overflow-y-auto">
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

      <!-- Chat groups -->
      <div>
        <div
          v-for="status in groupOrder"
          :key="status"
          class="border-t border-default"
        >
          <button
            class="w-full flex justify-between items-center px-6 py-3 text-sm font-medium text-default hover:bg-hover focus:outline-none"
            @click="toggleGroup(status)"
            :aria-expanded="isGroupOpen(status).toString()"
            :aria-controls="`chat-group-${status}`"
          >
            <span class="uppercase text-xs tracking-wide">
              {{ statusLabel(status) }} ({{ groupedChats[status].length }})
            </span>
            <span
              class="material-icons transition-transform duration-300 ease-in-out"
              :class="{ 'rotate-180': isGroupOpen(status) }"
              >expand_more</span
            >
          </button>
          <div :id="`chat-group-${status}`" v-show="isGroupOpen(status)">
            <div v-if="groupedChats[status].length">
              <div
                v-for="chat in groupedChats[status]"
                :key="chat.id"
                @click="goToChat(chat.id)"
                @keydown.enter="goToChat(chat.id)"
                role="button"
                tabindex="0"
                :class="['chat-item group', { active: String(route.params.id) === String(chat.id) }]"
                :style="{ '--status-color': statusColor(chat.status) }"
              >
                <span
                  class="status-dot mr-3"
                  :style="{ backgroundColor: statusColor(chat.status) }"
                  :aria-label="`Status: ${statusLabel(chat.status)}`"
                ></span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-default truncate">
                    {{ chat.clientName }}
                  </p>
                  <p class="text-xs text-muted truncate">
                    {{ chat.lastMessage }}
                  </p>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    v-if="presenceCount(chat.id)"
                    class="presence-badge"
                    :style="{ backgroundColor: badgeColor(chat.status) }"
                    >{{ presenceCount(chat.id) }}</span
                  >
                  <span class="text-xs text-muted">{{ formatChatTime(chat.time) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="px-6 py-4 text-xs text-muted">
              {{ langStore.t('noChats') }}
            </div>
          </div>
        </div>
      </div>
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
    const key = chat.status === 'ended' ? 'idle' : chat.status;
    if (!groups[key]) groups[key] = [];
    groups[key].push(chat);
  });
  Object.keys(groups).forEach((k) => {
    groups[k].sort((a, b) => chatTimestamp(b) - chatTimestamp(a));
  });
  return groups;
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
function statusLabel(status) {
  switch (status) {
    case 'attention':
      return langStore.t('attention');
    case 'live':
      return langStore.t('live');
    case 'paused':
      return langStore.t('paused');
    case 'resolved':
      return langStore.t('resolved');
    case 'idle':
      return langStore.t('idle');
    default:
      return status;
  }
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

