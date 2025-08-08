<template>
  <div>
    <PageHeader
      :title="langStore.t('knowledgeTitle')"
      :subtitle="langStore.t('knowledgeSubtitle')"
    >
      <button @click="openCreateForm" class="btn-primary">
        <span class="material-icons-outlined mr-2 text-base">add</span>
        {{ langStore.t('createGroup') }}
      </button>
    </PageHeader>

    <div class="px-10">
      <div v-if="loading" class="table-container">
        <SkeletonLoader />
      </div>
      <div v-else-if="groups.length === 0" class="text-center py-16">
        <span class="material-icons-outlined text-7xl text-gray-400 dark:text-gray-600">folder_open</span>
        <h3 class="mt-4 text-xl font-semibold text-default">
          {{ langStore.t('noKnowledgeGroups') }}
        </h3>
        <p class="mt-1 text-muted">
          {{ langStore.t('clickCreateGroup') }}
        </p>
      </div>
      <div v-else class="table-container">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-default">
            <tr>
              <th class="px-6 py-4 font-medium text-default">{{ langStore.t('name') }}</th>
              <th class="px-6 py-4 font-medium text-default">{{ langStore.t('description') }}</th>
              <th class="px-6 py-4 font-medium text-default">{{ langStore.t('files') }}</th>
              <th class="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody class="divide-y border-default">
            <tr
              v-for="group in groups"
              :key="group.id"
              class="table-row group cursor-pointer"
              @click="onGroupRowClick(group)"
            >
              <td class="font-medium text-default px-6 py-4">{{ group.name }}</td>
              <td class="text-muted px-6 py-4 max-w-xs truncate">{{ group.description }}</td>
              <td class="text-muted px-6 py-4">{{ group.fileCount }}</td>
              <td class="text-right px-6 py-4 relative">
                <!-- Kebab menu for group actions -->
                <div class="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click.stop="toggleMenu(group.id)" class="action-btn">
                    <span class="material-icons-outlined text-base">more_vert</span>
                  </button>
                </div>
                <div
                  v-if="activeMenuId === group.id"
                  class="absolute right-0 mt-2 w-32 bg-secondary border border-default rounded-lg shadow-lg z-50 group-menu"
                >
                  <button
                    @click.stop="confirmDeleteGroup(group)"
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
import KnowledgeGroupForm from '@/components/KnowledgeGroupForm.vue';
import { sidePanelStore } from '@/stores/sidePanelStore';
import langStore from '@/stores/langStore';

const router = useRouter();
const groups = ref([]);
const loading = ref(true);

// Track which group's menu is open.  Only one menu is shown at a time.
const activeMenuId = ref(null);
const toggleMenu = (id) => {
  activeMenuId.value = activeMenuId.value === id ? null : id;
};

// Close menu when clicking outside of any group menu or action button
function handleClickOutside(event) {
  const target = event.target;
  const menu = target.closest('.group-menu');
  const actionBtn = target.closest('.action-btn');
  if (!menu && !actionBtn) {
    activeMenuId.value = null;
  }
}

const fetchGroups = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('/knowledge_groups');
    groups.value = response.data;
  } catch (e) {
    console.error('Failed to load knowledge groups:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchGroups);

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const openCreateForm = () => {
  sidePanelStore.open(KnowledgeGroupForm, { onSaveSuccess: fetchGroups });
};

const confirmDeleteGroup = async (group) => {
  const message = `${langStore.t('delete')} "${group.name}"?`;
  if (confirm(message)) {
    try {
      await apiClient.delete(`/knowledge_groups/${group.id}`);
      await fetchGroups();
    } catch (e) {
      console.error('Failed to delete group:', e);
    }
  }
};

const goToGroup = (id) => {
  router.push(`/knowledge/${id}`);
};

// Prevent navigation when action menu is open for this row
const onGroupRowClick = (group) => {
  if (activeMenuId.value !== group.id) {
    goToGroup(group.id);
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
.action-btn {
  @apply p-2 rounded-full transition-colors;
}
.action-btn:hover {
  background-color: var(--c-bg-hover);
  color: var(--c-text-accent);
}
</style>
