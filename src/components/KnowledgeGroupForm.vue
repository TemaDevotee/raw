<template>
  <div class="p-10 flex flex-col h-full bg-secondary">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-default">{{ langStore.t('createKnowledgeGroup') }}</h1>
    </header>

    <form @submit.prevent="saveGroup" class="flex-grow flex flex-col min-h-0">
      <div class="flex-grow space-y-6">
        <div>
          <label for="group-name" class="form-label">{{ langStore.t('groupName') }}</label>
          <input
            type="text"
            v-model="group.name"
            id="group-name"
            class="form-input"
            placeholder="e.g., Product Manuals"
            required
          />
        </div>
        <div>
          <label for="group-desc" class="form-label">{{ langStore.t('description') }}</label>
          <textarea
            v-model="group.description"
            id="group-desc"
            rows="4"
            class="form-input"
            :placeholder="langStore.t('groupDescription')"
          ></textarea>
        </div>
      </div>
      <footer class="mt-6 flex justify-end items-center flex-shrink-0 pt-4 border-t border-default">
        <button type="button" @click="maybeClose" class="btn-secondary">{{ langStore.t('cancel') }}</button>
        <button type="submit" class="btn-primary ml-4">{{ langStore.t('createGroupAction') }}</button>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import apiClient from '../api';
import langStore from '@/stores/langStore.js';
import { sidePanelStore } from '@/stores/sidePanelStore.js';

const props = defineProps({ onSaveSuccess: Function });
const emit = defineEmits(['close']);

const group = ref({ name: '', description: '' });

const saveGroup = async () => {
  try {
    await apiClient.post('/knowledge_groups', group.value);
    if (props.onSaveSuccess) props.onSaveSuccess();
    emit('close');
  } catch (e) {
    console.error("Failed to save knowledge group:", e);
  }
};

// Unsaved change detection
const initialState = { name: '', description: '' };
const isDirty = () => {
  return group.value.name !== initialState.name || group.value.description !== initialState.description;
};
function maybeClose() {
  if (isDirty()) {
    if (confirm(langStore.t('unsavedChanges'))) emit('close');
  } else emit('close');
}

// Warn users about unsaved changes when closing via backdrop or Esc
onMounted(() => {
  sidePanelStore.beforeClose = () => {
    if (isDirty()) {
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
.border-default { border-color: var(--c-border); }
.form-label { @apply block mb-2 text-sm font-medium; }
.form-input {
  @apply w-full px-4 py-2 rounded-md border shadow-sm;
  background-color: var(--c-bg-input);
  border-color: var(--c-border);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus {
  @apply ring-2 border-transparent outline-none;
  --tw-ring-color: var(--c-text-brand);
}
</style>
