<template>
  <div class="flex h-full">
    <!-- Left column: chat list with search/filter and groups -->
    <div
      class="w-full max-w-md border-r border-default flex flex-col overflow-y-auto"
    >
      <PageHeader :title="langStore.t('chats')" />

      <!-- Search and filter controls -->
      <div class="px-6 pb-4 flex flex-wrap items-center gap-3 sticky top-0 z-10 bg-secondary/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
        <!-- Modern search input: pill shape with subtle shadow and placeholder colour -->
        <input
          v-model="searchQuery"
          :placeholder="langStore.t('selectChat')"
          class="flex-1 min-w-[8rem] px-4 py-2 rounded-full border border-default bg-input text-default placeholder:text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-text-brand)]"
        />
        <!-- Status filter: pill shape matching the search input -->
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

      <!-- Groups of chats with accordions -->
      <div>
        <div
          v-for="(groupChats, status) in groupedChats"
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
              {{ statusLabel(status) }} ({{ groupChats.length }})
            </span>
            <span
              class="material-icons transition-transform duration-300 ease-in-out"
              :class="{ 'rotate-180': isGroupOpen(status) }"
              >expand_more
            </span>
          </button>
          <div
            :id="`chat-group-${status}`"
      v-show="isGroupOpen(status)"
    >
      <transition name="accordion">
        <div
          v-show="isGroupOpen(status)"
        >
          <div
            v-for="chat in groupChats"
            :key="chat.id"
            @click="goToChat(chat.id)"
            class="chat-item group"
          >
            <span
              class="status-dot mr-3"
              :class="statusColorClass(chat.status)"
            ></span>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-default truncate">
                {{ chat.clientName }}
              </p>
              <p class="text-xs text-muted truncate">
                {{ chat.lastMessage }}
              </p>
            </div>
            <div class="flex items-center space-x-2"><span class="status-dot" :data-status="chat.status"></span><span v-if="(presenceMap[String(chat.id)]||[]).length" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">{{ (presenceMap[String(chat.id)]||[]).length }}</span>
              <span class="text-xs text-muted">{{ formatChatTime(chat.time) }}</span>
              <!-- You could display channel icons here if desired -->
            </div>
          </div>
        </div>
      </transition>
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
import { useRouter } from 'vue-router';
import apiClient from '@/api';
import PageHeader from '@/components/PageHeader.vue';
import langStore from '@/stores/langStore';

const router = useRouter();
const chats = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const liveSearch = ref('');
watch(searchQuery, (v)=> { clearTimeout(window.__searchDebounce); window.__searchDebounce = setTimeout(()=> liveSearch.value = v, 200); });;
const presenceMap = ref({});
async function refreshPresence(){ try{ const res = await apiClient.get('/presence'); presenceMap.value = res.data||{}; } catch{} }
const selectedStatus = ref('');

// Fetch chats from API
const fetchChats = async () => {
  loading.value = true;
  try {
    const res = await apiClient.get('/chats');
    chats.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};
onMounted(fetchChats);
onBeforeUnmount(()=>{ try{ clearInterval(window.__presencePoll) }catch{} })

// Computed: filtered chats by search and status
const filteredChats = computed(() => {
  return chats.value.filter((c) => {
    const matchSearch =
      !liveSearch.value ||
      c.clientName.toLowerCase().includes(liveSearch.value.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(liveSearch.value.toLowerCase());
    const matchStatus =
      !selectedStatus.value || c.status === selectedStatus.value;
    return matchSearch && matchStatus;
  });
});

// Group chats by status
const groupedChats = computed(() => {
  const groups = {};
  filteredChats.value.forEach((chat) => {
    const key = chat.status === 'ended' ? 'idle' : chat.status;
    if (!groups[key]) groups[key] = [];
    groups[key].push(chat);
  });
  return groups;
});

// Track which groups are open (accordion) and persist their state
// between reloads using sessionStorage.  Users may collapse/expand
// any status section and the choice will be remembered for the
// duration of the session.  We use JSON.parse/stringify to store
// the openGroups object under a dedicated key.
const OPEN_GROUPS_KEY = 'chatOpenGroups';
const openGroups = ref({});

// Load previously stored group state on mount
onMounted(() => { refreshPresence(); window.__presencePoll = setInterval(refreshPresence, 12000);
  try {
    const saved = sessionStorage.getItem(OPEN_GROUPS_KEY);
    if (saved) {
      openGroups.value = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to restore chat accordion state from sessionStorage', e);
  }
});

// Persist openGroups whenever it changes
const persistOpenGroups = () => {
  try {
    sessionStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(openGroups.value));
  } catch (e) {
    console.warn('Failed to persist chat accordion state', e);
  }
};

const toggleGroup = (status) => {
  openGroups.value[status] = !openGroups.value[status];
  persistOpenGroups();
};

const isGroupOpen = (status) => {
  // default: open all groups when there is no search or filter; collapse otherwise
  if (openGroups.value[status] === undefined) {
    return !selectedStatus.value && !liveSearch.value;
  }
  return !!openGroups.value[status];
};

const statusLabel = (status) => {
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
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const goToChat = (id) => {
  router.push(`/chats/${id}`);
};

const statusColorClass = (status) => {
  const s = status === 'ended' ? 'idle' : status;
  switch (s) {
    case 'attention':
      return 'bg-red-500 dark:bg-red-400';
    case 'live':
      return 'bg-green-500 dark:bg-green-400';
    case 'paused':
      return 'bg-yellow-500 dark:bg-yellow-400';
    case 'resolved':
    case 'idle':
      return 'bg-gray-400 dark:bg-gray-500';
    default:
      return 'bg-gray-400 dark:bg-gray-500';
  }
};

// Format chat timestamps with localisation support.  The backend stores
// simple strings like 'now', '5m', '2h' or a raw time string.  Convert
// these into localised labels (e.g. '5 minutes' / '5 минут').
const formatChatTime = (timeStr) => {
  if (!timeStr) return '';
  // Normalize by trimming whitespace and converting to lowercase for pattern checks
  const normalized = timeStr.trim().toLowerCase();
  // 'now' or variants like 'just now'
  if (normalized === 'now' || normalized === 'just now') {
    return langStore.t('nowLabel');
  }
  // Patterns like '5m', '5m ago', '2h', '2h ago', '1d', '1d ago'
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
      // For days, reuse 'hour/hours' translation because dedicated translation keys
      // for days are not defined.  You could add separate keys if needed.
      const word = n === 1 ? langStore.t('day') || 'day' : langStore.t('days') || 'days';
      return `${n} ${word}`;
    }
  }
  // Fallback: return original string
  return timeStr;
};
</script>

<style scoped>
.chat-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.chat-item:hover {
  /* Use the hover background colour for greater contrast */
  background-color: var(--c-bg-hover);
}
.chat-item.active {
  background-color: var(--c-bg-hover);
}
.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}
.bg-input {
  background-color: var(--c-bg-secondary);
}

/* Accordion animation for chat group expansion/collapse */
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


<style scoped>
.status-dot { width:8px;height:8px;border-radius:999px;display:inline-block;background:#22c55e;opacity:.7; }
.status-dot[data-status="live"]{ background:#22c55e }
.status-dot[data-status="resolved"]{ background:#84cc16 }
.status-dot[data-status="ended"]{ background:#ef4444 }
.status-dot[data-status="pending"]{ background:#f59e0b }
</style>