<template>
  <div>
    <!-- Custom header: back button, group title/description, and add file button -->
    <header class="flex justify-between items-center px-10 pt-10 mb-8">
      <div class="flex items-center space-x-4">
        <RouterLink to="/knowledge" class="btn-secondary">
          <span class="material-icons-outlined mr-2 text-base">arrow_back</span>
          {{ langStore.t('backToAll') }}
        </RouterLink>
        <div>
          <h1 class="text-3xl font-bold text-default">
            {{ group.name || 'Loading...' }}
          </h1>
          <p class="text-muted" v-if="group.description">{{ group.description }}</p>
        </div>
      </div>
      <button @click="openFileForm" class="btn-primary">
        <span class="material-icons-outlined mr-2 text-base">add</span>
        {{ langStore.t('addFile') }}
      </button>
    </header>
    <div class="px-10">
        <div v-if="loading" class="table-container"><SkeletonLoader/></div>
        <div v-else-if="!group.files || group.files.length === 0" class="text-center py-16 space-y-4 flex flex-col items-center justify-center">
            <span class="material-icons-outlined text-7xl text-gray-400 dark:text-gray-600">description</span>
            <h3 class="mt-4 text-xl font-semibold text-default">{{ langStore.t('groupEmpty') }}</h3>
            <p class="text-muted">{{ langStore.t('clickAddFile') }}</p>
            <button @click="openFileForm" class="btn-primary mt-4 flex items-center">
              <span class="material-icons-outlined mr-2 text-base">add</span>
              {{ langStore.t('addFile') }}
            </button>
        </div>
        <div v-else class="table-container">
            <table class="min-w-full text-left text-sm">
                <thead class="border-b border-default">
                    <tr>
                    <th class="px-6 py-4 font-medium text-default">{{ langStore.t('name') }}</th>
                        <th class="px-6 py-4 font-medium text-default">{{ langStore.t('type') }}</th>
                        <th class="px-6 py-4 font-medium text-default">{{ langStore.t('details') }}</th>
                        <th class="px-6 py-4"></th>
                    </tr>
                </thead>
                <tbody class="divide-y border-default">
                    <tr
                        v-for="file in group.files"
                        :key="file.id"
                        class="table-row group cursor-pointer"
                        @click="onFileRowClick(file)"
                    >
                        <td class="font-medium text-default px-6 py-4 flex items-center">
                            <!-- Icon based on file type -->
                            <span class="material-icons-outlined mr-2 text-xl">
                              {{ getFileIcon(file.type) }}
                            </span>
                            <span class="hover:underline">
                              {{ file.name }}
                            </span>
                        </td>
                        <td class="text-muted capitalize px-6 py-4">{{ file.type }}</td>
                        <td class="text-muted px-6 py-4">{{ file.details }}</td>
                        <td class="text-right px-6 py-4 relative file-menu-container">
                            <!-- Action menu triggered by a three‑dot icon -->
                            <div class="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button @click.stop="toggleFileMenu(file.id)" class="action-btn">
                                    <span class="material-icons-outlined text-base">more_vert</span>
                                </button>
                            </div>
                            <div
                                v-if="activeFileMenu === file.id"
                                class="absolute right-0 mt-2 w-32 bg-secondary border border-default rounded-lg shadow-lg z-50 file-menu"
                            >
                                <button
                                    @click.stop="confirmDeleteFile(file)"
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
import { useRoute, RouterLink } from 'vue-router';
import apiClient from '@/api';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { sidePanelStore } from '@/stores/sidePanelStore';
import KnowledgeFileForm from '@/components/KnowledgeFileForm.vue';
import KnowledgeFileViewer from '@/components/KnowledgeFileViewer.vue';
import langStore from '@/stores/langStore.js';

const route = useRoute();
const groupId = route.params.id;
const group = ref({});
const loading = ref(true);

// Track which file's action menu is open.  Only one menu may be open at a time.
const activeFileMenu = ref(null);
const toggleFileMenu = (id) => {
    activeFileMenu.value = activeFileMenu.value === id ? null : id;
};

// Close file action menu when clicking outside any menu or action button.
function handleClickOutside(event) {
    const target = event.target;
    const menu = target.closest('.file-menu');
    const actionBtn = target.closest('.action-btn');
    if (!menu && !actionBtn) {
        activeFileMenu.value = null;
    }
}

const fetchGroupDetails = async () => {
    loading.value = true;
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
        const response = await apiClient.get(`/knowledge_groups/${groupId}`);
        group.value = response.data;
    } catch (e) { console.error(e); }
    finally { loading.value = false; }
};

onMounted(fetchGroupDetails);

// Register outside click handler when component mounts
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

const openFileForm = () => {
    sidePanelStore.open(KnowledgeFileForm, {
        groupId: groupId,
        onSaveSuccess: fetchGroupDetails,
    });
};


const confirmDeleteFile = async (file) => {
    const msg = `${langStore.t('delete')} "${file.name}"?`;
    if (confirm(msg)) {
        try {
            await apiClient.delete(`/knowledge_groups/${groupId}/files/${file.id}`);
            await fetchGroupDetails(); // Обновляем список файлов
        } catch (e) {
            console.error('Failed to delete file:', e);
        }
    }
};

// Open file viewer in side panel
const openFile = (file) => {
    sidePanelStore.open(KnowledgeFileViewer, {
        file,
        groupId: groupId,
        onSaveSuccess: fetchGroupDetails,
    });
};

// Avoid opening the viewer when the action menu is open for this file
const onFileRowClick = (file) => {
    if (activeFileMenu.value !== file.id) {
        openFile(file);
    }
};

// Determine icon based on file type
const getFileIcon = (type) => {
    switch (type) {
        case 'pdf':
            return 'picture_as_pdf';
        case 'text':
            return 'article';
        case 'url':
            return 'link';
        default:
            return 'insert_drive_file';
    }
};
</script>

<style scoped>
th, td { @apply px-6 py-4; }
.text-default { color: var(--c-text-primary); }
.text-muted { color: var(--c-text-secondary); }
.border-default { border-color: var(--c-border); }
.table-container { @apply overflow-hidden rounded-lg border border-default; background-color: var(--c-bg-secondary); }
.table-row { transition: background-color 0.15s ease-in-out; }
.table-row:hover { background-color: var(--c-bg-input, rgba(0,0,0,0.02)); }
.action-btn { @apply p-2 rounded-full transition-colors; }
.action-btn:hover { background-color: var(--c-bg-hover); color: var(--c-text-accent); }
</style>
