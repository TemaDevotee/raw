<template>
  <div>
    <PageHeader
      :title="langStore.t('agents')"
      :subtitle="langStore.t('agentsSubtitle')"
    >
      <button @click="openCreateForm()" class="btn-primary">
        <span class="material-icons-outlined mr-2 text-base">add</span>
        {{ langStore.t('createAgent') }}
      </button>
    </PageHeader>

    <div class="px-10">
      <div v-if="loading" class="table-container">
        <SkeletonLoader />
      </div>
      <div v-else-if="agents.length === 0" class="text-center py-16">
        <span class="material-icons-outlined text-7xl text-gray-400 dark:text-gray-600"
          >group_add</span
        >
        <h3 class="mt-4 text-xl font-semibold text-default">{{ langStore.t('noAgents') }}</h3>
        <p class="mt-1 text-muted">
          {{ langStore.t('clickToCreate') }}
        </p>
      </div>
      <div v-else class="table-container">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-default">
            <tr>
              <th class="px-6 py-4 font-medium text-default">{{ langStore.t('name') }}</th>
              <th class="px-6 py-4 font-medium text-default">{{ langStore.t('modelLabel') }}</th>
              <th class="px-6 py-4 font-medium text-default">{{ langStore.t('channels') }}</th>
              <th class="px-6 py-4 font-medium text-default">{{ langStore.t('knowledgeColumn') }}</th>
              <th class="px-6 py-4 font-medium text-default">{{ langStore.t('statusColumn') }}</th>
              <th class="px-6 py-4 font-medium text-default text-right">
                {{ langStore.t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y border-default">
            <tr
              v-for="agent in agents"
              :key="agent.id"
              class="table-row group cursor-pointer"
              @click="onRowClick(agent)"
            >
              <td class="whitespace-nowrap px-6 py-4 font-semibold text-default">
                {{ agent.name }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-muted">
                {{ agent.model }}
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <span v-if="agent.channels.length === 0" class="text-muted">-</span>
                <span
                  v-else
                  v-for="ch in agent.channels"
                  :key="ch"
                  class="inline-flex items-center mr-2"
                >
                  <span class="material-icons-outlined text-base">{{ getChannelIcon(ch) }}</span>
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-muted">
                {{ getKnowledgeNames(agent) }}
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <span
                  class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                  :class="
                    agent.isPublished
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  "
                >
                  <span
                    class="mr-1 w-2 h-2 rounded-full"
                    :class="
                      agent.isPublished
                        ? 'bg-green-500 dark:bg-green-300'
                        : 'bg-gray-400 dark:bg-gray-500'
                    "
                  ></span>
                  {{ agent.isPublished ? langStore.t('statusPublished') : langStore.t('statusDraft') }}
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right relative agent-menu-container">
                <!-- Three‑dot action menu: only appears on hover.  Clicking the
                     button toggles a small popover with edit/delete actions. -->
                <div class="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click.stop="toggleMenu(agent.id)" class="action-btn">
                    <span class="material-icons-outlined text-base">more_vert</span>
                  </button>
                </div>
                <div
                  v-if="activeMenuRow === agent.id"
                  class="absolute right-0 mt-2 w-32 bg-secondary border border-default rounded-lg shadow-lg z-50 agent-menu"
                >
                  <button
                    @click.stop="openEditForm(agent.id)"
                    class="block w-full text-left px-4 py-2 hover:bg-hover"
                  >
                    {{ langStore.t('edit') || 'Edit' }}
                  </button>
                  <button
                    @click.stop="confirmDeleteAgent(agent)"
                    class="block w-full text-left px-4 py-2 hover:bg-hover text-red-600"
                  >
                    {{ langStore.t('delete') || 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/api';
import PageHeader from '@/components/PageHeader.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { sidePanelStore } from '@/stores/sidePanelStore';
import AgentForm from '@/components/AgentForm.vue';
import langStore from '@/stores/langStore';

const agents = ref([]);
const knowledgeGroups = ref([]);
const loading = ref(true);
const router = useRouter();

// Track which row's action menu is open.  Only one menu can be open at a
// time.  Clicking the same row again closes it.  Clicking outside is
// intentionally not handled here to avoid complexity; however, the menu
// automatically closes when another menu is opened or an action is taken.
const activeMenuRow = ref(null);
const toggleMenu = (id) => {
  activeMenuRow.value = activeMenuRow.value === id ? null : id;
};

// Handle closing of three‑dot menus when clicking outside of any menu or
// action button.  We determine if the click target or one of its
// ancestors has the 'agent-menu' or 'action-btn' classes; if not,
// close the menu.
function handleClickOutside(event) {
  const target = event.target;
  const menu = target.closest('.agent-menu');
  const actionBtn = target.closest('.action-btn');
  if (!menu && !actionBtn) {
    activeMenuRow.value = null;
  }
}

const fetchAgents = async () => {
  loading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 300));
  try {
    const response = await apiClient.get('/agents');
    agents.value = response.data;
  } catch (error) {
    console.error('Failed to fetch agents:', error);
  } finally {
    loading.value = false;
  }
};

const fetchKnowledgeGroups = async () => {
  try {
    const response = await apiClient.get('/knowledge_groups');
    knowledgeGroups.value = response.data;
  } catch (error) {
    console.error('Failed to fetch knowledge groups:', error);
  }
};

onMounted(async () => {
  await Promise.all([fetchAgents(), fetchKnowledgeGroups()]);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const getChannelIcon = (channel) => {
  switch (channel) {
    case 'web':
      return 'language';
    case 'telegram':
      return 'send';
    case 'whatsapp':
      return 'chat';
    default:
      return 'devices';
  }
};

const getKnowledgeNames = (agent) => {
  if (!agent.knowledgeIds || agent.knowledgeIds.length === 0) {
    return '-';
  }
  const names = agent.knowledgeIds
    .map((id) => {
      const group = knowledgeGroups.value.find((g) => g.id === id);
      return group ? group.name : null;
    })
    .filter(Boolean);
  return names.length > 0 ? names.join(', ') : '-';
};

const openCreateForm = () => {
  sidePanelStore.open(AgentForm, { onSaveSuccess: fetchAgents });
};
const openEditForm = (agentId) => {
  sidePanelStore.open(AgentForm, { agentId, onSaveSuccess: fetchAgents });
};
const confirmDeleteAgent = async (agent) => {
  // Localised confirm message using the generic 'delete' label from langStore.
  const msg = `${langStore.t('delete')} "${agent.name}"?`;
  if (confirm(msg)) {
    try {
      await apiClient.delete(`/agents/${agent.id}`);
      await fetchAgents();
    } catch (e) {
      console.error('Failed to delete agent', e);
    }
  }
};

// переход на страницу деталей агента
const viewAgent = (id) => {
  router.push(`/agents/${id}`);
};

// Only navigate when no action menu is open for this row.  Prevents
// accidental navigation when the 3-dot menu is displayed.
const onRowClick = (agent) => {
  if (activeMenuRow.value !== agent.id) {
    viewAgent(agent.id);
  }
};
</script>

<style scoped>
.text-default {
  color: var(--c-text-primary);
}
.text-muted {
  color: var(--c-text-secondary);
}
.border-default {
  border-color: var(--c-border);
}
.table-container {
  @apply overflow-hidden rounded-lg border border-default;
  background-color: var(--c-bg-secondary);
}
.table-row {
  transition: background-color 0.15s ease-in-out;
}
.table-row:hover {
  background-color: var(--c-bg-input, rgba(0, 0, 0, 0.02));
}
.table-row:hover {
  background-color: var(--c-bg-input, rgba(0, 0, 0, 0.02));
}
.action-btn {
  @apply p-2 rounded-full transition-colors;
}
.action-btn:hover {
  background-color: var(--c-bg-hover);
  color: var(--c-text-accent);
}
</style>
