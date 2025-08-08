<template>
  <div class="p-10 flex flex-col h-full bg-secondary">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-default">
        {{ isEditing ? langStore.t('editAgent') : langStore.t('createAgentHeader') }}
      </h1>
    </header>

    <div v-if="loading" class="flex-grow flex items-center justify-center text-muted">
      {{ langStore.t('loadingFormData') }}
    </div>
    <form v-else @submit.prevent="saveAgent" class="flex-grow flex flex-col min-h-0">
      <!-- Form fields -->
      <div class="flex-grow space-y-6 overflow-y-auto pr-4 -mr-4">
        <div>
          <label for="agent-name" class="form-label">{{ langStore.t('agentName') }}</label>
          <input
            type="text"
            v-model="agent.name"
            id="agent-name"
            class="form-input"
            placeholder="e.g., Support Pro"
            required
          />
        </div>
        <div>
          <label class="form-label">{{ langStore.t('personality') }}</label>
          <select v-model="agent.personality" class="form-input">
            <option>{{ langStore.t('formal') }}</option>
            <option>{{ langStore.t('friendly') }}</option>
            <option>{{ langStore.t('witty') }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ langStore.t('model') }}</label>
          <div class="space-y-2">
            <label v-for="model in llmModels" :key="model.id" class="model-selection-label">
              <input
                type="radio"
                :value="model.name"
                v-model="agent.model"
                name="model"
                class="h-4 w-4 text-brand focus:ring-brand"
              />
              <div class="ml-3 text-sm">
                <span class="font-medium text-default">{{ model.name }}</span>
                <span
                  v-for="tag in model.tags"
                  :key="tag"
                  class="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800"
                  >{{ tag }}</span
                >
                <p class="text-muted">{{ model.description }}</p>
              </div>
            </label>
          </div>
        </div>
        <!-- Knowledge base selection -->
        <div>
          <label class="form-label">{{ langStore.t('knowledgeBases') }}</label>
          <div class="space-y-1 pl-1">
            <div v-if="knowledgeGroups.length === 0" class="text-muted text-sm">
              {{ langStore.t('noKnowledgeAvailable') }}
            </div>
            <label v-for="group in knowledgeGroups" :key="group.id" class="flex items-center space-x-2">
              <input
                type="checkbox"
                :value="group.id"
                v-model="selectedKnowledgeIds"
                class="h-4 w-4 text-brand focus:ring-brand"
              />
              <span class="text-default">{{ group.name }}</span>
            </label>
          </div>
        </div>
        <!-- System prompt input -->
        <div>
          <label class="form-label" for="system-prompt">{{ langStore.t('systemPrompt') }}</label>
          <textarea
            id="system-prompt"
            v-model="agent.systemPrompt"
            rows="4"
            class="form-input"
            placeholder="Define the agent's personality or instructions..."
          ></textarea>
        </div>
        <!-- Publish toggle -->
        <div class="flex items-center space-x-3">
          <label class="form-label mb-0">{{ langStore.t('published') }}</label>
          <!-- Custom switch: when checked the track uses the brand colour and the thumb slides right -->
          <label class="relative inline-flex items-center cursor-pointer select-none">
            <input type="checkbox" v-model="agent.isPublished" class="sr-only peer" />
            <!-- Track -->
            <div
              class="w-10 h-5 rounded-full border border-default transition-colors"
              :class="agent.isPublished ? 'brand-bg' : 'bg-gray-300 dark:bg-gray-600'"
            ></div>
            <!-- Thumb -->
            <div
              class="absolute left-1 top-1 w-3 h-3 rounded-full bg-white transition-transform"
              :class="agent.isPublished ? 'translate-x-5' : ''"
            ></div>
          </label>
          <span class="text-muted text-sm" v-if="!agent.isPublished">{{ langStore.t('draft') }}</span>
          <span class="text-green-700 text-sm" v-else>{{ langStore.t('published') }}</span>
        </div>
      </div>

      <!-- Footer buttons -->
      <footer class="mt-6 flex justify-between items-center flex-shrink-0 pt-4 border-t border-default">
        <div>
        <button v-if="isEditing" @click.prevent="handleDelete" type="button" class="btn-danger">
            {{ langStore.t('deleteAgent') }}
        </button>
        </div>
        <div class="flex items-center">
            <button type="button" @click="maybeClose" class="btn-secondary">{{ langStore.t('cancel') }}</button>
            <button type="submit" class="btn-primary ml-4">{{ langStore.t('saveAgent') }}</button>
        </div>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import apiClient from '../api';
import langStore from '@/stores/langStore.js';
import { sidePanelStore } from '@/stores/sidePanelStore.js';

const props = defineProps({
  agentId: String,
  onSaveSuccess: Function
});
const emit = defineEmits(['close']);

const agent = ref({ name: '', personality: 'Friendly', model: '', knowledgeIds: [], systemPrompt: '', isPublished: false });
const knowledgeGroups = ref([]);
const selectedKnowledgeIds = ref([]);
const llmModels = ref([]);
const loading = ref(true);

const isEditing = computed(() => !!props.agentId);

// Preserve the original state when editing or creating to detect unsaved changes
let initialAgentSnapshot = null;
let initialKnowledgeSnapshot = [];

onMounted(async () => {
  await fetchData();
});

watch(() => props.agentId, fetchData);

async function fetchData() {
    loading.value = true;
    try {
        const modelsResponse = await apiClient.get('/llm_models');
        llmModels.value = modelsResponse.data;

        // Fetch knowledge groups for multi-select
        const groupsResponse = await apiClient.get('/knowledge_groups');
        knowledgeGroups.value = groupsResponse.data;

        if (isEditing.value) {
            const agentResponse = await apiClient.get(`/agents/${props.agentId}`);
            agent.value = agentResponse.data;
            if (!agent.value.knowledgeIds) agent.value.knowledgeIds = [];
            if (!agent.value.systemPrompt) agent.value.systemPrompt = '';
            if (typeof agent.value.isPublished !== 'boolean') agent.value.isPublished = false;
            selectedKnowledgeIds.value = [...agent.value.knowledgeIds];
            // snapshot initial values
            initialAgentSnapshot = JSON.parse(JSON.stringify(agent.value));
            initialKnowledgeSnapshot = [...selectedKnowledgeIds.value];
        } else {
            agent.value = {
                name: '',
                personality: 'Friendly',
                model: llmModels.value[0]?.name || '',
                knowledgeIds: [],
                systemPrompt: '',
                isPublished: false,
            };
            selectedKnowledgeIds.value = [];
            initialAgentSnapshot = JSON.parse(JSON.stringify(agent.value));
            initialKnowledgeSnapshot = [];
        }
    } catch (e) { console.error("Failed to load form data:", e); }
    finally { loading.value = false; }
}

const saveAgent = async () => {
    try {
        agent.value.knowledgeIds = [...selectedKnowledgeIds.value];
        if (isEditing.value) {
            await apiClient.patch(`/agents/${props.agentId}`, agent.value);
        } else {
            await apiClient.post('/agents', agent.value);
        }
        if (props.onSaveSuccess) {
            props.onSaveSuccess();
        }
        emit('close');
    } catch (e) { console.error("Failed to save agent:", e); }
};

const handleDelete = async () => {
    const msg = `${langStore.t('delete')} \"${agent.value.name}\"?`;
    if (confirm(msg)) {
        try {
            await apiClient.delete(`/agents/${props.agentId}`);
            if (props.onSaveSuccess) {
                props.onSaveSuccess();
            }
            emit('close');
        } catch (e) {
            console.error('Failed to delete agent', e);
        }
    }
};

// Check for unsaved changes by comparing the current agent and knowledge IDs
// with snapshots captured at load time.  Used when closing the form to warn
// the user about discarding changes.
function hasUnsavedChanges() {
    try {
        const current = JSON.stringify({ ...agent.value, knowledgeIds: selectedKnowledgeIds.value });
        const initial = JSON.stringify({ ...initialAgentSnapshot, knowledgeIds: initialKnowledgeSnapshot });
        return current !== initial;
    } catch (e) {
        return false;
    }
}

function maybeClose() {
    if (hasUnsavedChanges()) {
        if (confirm(langStore.t('unsavedChanges'))) {
            emit('close');
        }
    } else {
        emit('close');
    }
}

// Register a beforeClose hook on mount so that navigating away via the
// backdrop or pressing Esc triggers an unsaved changes prompt.  The hook
// returns a boolean: returning false cancels the close.
onMounted(() => {
    sidePanelStore.beforeClose = () => {
        if (hasUnsavedChanges()) {
            return confirm(langStore.t('unsavedChanges'));
        }
        return true;
    };
});

onUnmounted(() => {
    if (sidePanelStore.beforeClose) {
        sidePanelStore.beforeClose = null;
    }
});
</script>

<style scoped>
.bg-secondary { background-color: var(--c-bg-secondary); }
.text-default { color: var(--c-text-primary); }
.text-muted { color: var(--c-text-secondary); }
.border-default { border-color: var(--c-border); }
.text-brand { color: var(--c-text-brand); }
.focus\:ring-brand:focus { --tw-ring-color: var(--c-text-brand); }
.form-label { @apply block mb-2 text-sm font-medium; }
.form-input { 
  @apply w-full p-2.5 rounded-md border;
  background-color: var(--c-bg-input, var(--c-bg-primary));
  border-color: var(--c-border);
  transition: border-color 0.2s;
}
.form-input:focus { 
  @apply ring-2 border-transparent outline-none;
  --tw-ring-color: var(--c-text-brand);
}
.model-selection-label { @apply flex items-start p-3 border rounded-lg cursor-pointer; transition: border-color 0.2s; }
.model-selection-label:has(input:checked) {
  border-color: var(--c-text-brand);
  background-color: rgba(14, 165, 233, 0.1);
}
.dark .model-selection-label:has(input:checked) {
    background-color: rgba(56, 189, 248, 0.1);
}

/* Custom background for the publish switch when checked */
.brand-bg {
  background-color: var(--c-text-brand);
}
</style>
