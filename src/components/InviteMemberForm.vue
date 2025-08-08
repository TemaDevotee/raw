<template>
  <div class="p-10 flex flex-col h-full bg-secondary">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-default">{{ langStore.t('inviteNewMember') }}</h1>
      <p class="text-muted mt-1">{{ langStore.t('inviteDesc') }}</p>
    </header>
    <form @submit.prevent="invite" class="flex-grow flex flex-col min-h-0 space-y-6">
      <div>
        <label class="form-label" for="member-name">{{ langStore.t('fullName') }}</label>
        <input id="member-name" type="text" v-model="member.name" class="form-input" placeholder="Full Name" required />
      </div>
      <div>
        <label class="form-label" for="member-email">{{ langStore.t('email') }}</label>
        <input id="member-email" type="email" v-model="member.email" class="form-input" placeholder="email@example.com" required />
      </div>
      <div>
        <label class="form-label" for="member-role">{{ langStore.t('role') }}</label>
        <select id="member-role" v-model="member.role" class="form-input">
          <option value="Admin">{{ langStore.t('admin') }}</option>
          <option value="Operator">{{ langStore.t('operator') }}</option>
          <option value="Read-only">{{ langStore.t('readOnly') }}</option>
        </select>
      </div>
      <footer class="mt-auto pt-4 border-t border-default flex justify-end">
        <button type="button" @click="maybeClose" class="btn-secondary">{{ langStore.t('cancel') }}</button>
        <button type="submit" class="btn-primary ml-4">{{ langStore.t('invite') }}</button>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import apiClient from '@/api';
import langStore from '@/stores/langStore.js';
import { sidePanelStore } from '@/stores/sidePanelStore.js';

const props = defineProps({ onSaveSuccess: Function });
const emit = defineEmits(['close']);

const member = ref({ name: '', email: '', role: 'Operator' });

async function invite() {
  try {
    // When inviting a new member mark their status as "invited" so the UI can
    // display a pending pill.  The API will default to 'invited' if not
    // provided but we include it explicitly for clarity.
    await apiClient.post('/account/team', { ...member.value, status: 'invited' });
    if (props.onSaveSuccess) props.onSaveSuccess();
    emit('close');
  } catch (e) {
    console.error('Failed to invite member:', e);
  }
}

// Initial state snapshot for unsaved detection
const initialMember = { name: '', email: '', role: 'Operator' };
function isDirty() {
  return (
    member.value.name !== initialMember.name ||
    member.value.email !== initialMember.email ||
    member.value.role !== initialMember.role
  );
}
function maybeClose() {
  if (isDirty()) {
    if (confirm(langStore.t('unsavedChanges'))) emit('close');
  } else {
    emit('close');
  }
}

// Register beforeClose hook on mount to handle unsaved changes when closing via backdrop/Esc
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
.text-muted { color: var(--c-text-secondary); }
.border-default { border-color: var(--c-border); }
.form-label { @apply block mb-2 text-sm font-medium; }
.form-input {
  @apply w-full px-4 py-2 rounded-full border shadow-sm;
  background-color: var(--c-bg-input);
  border-color: var(--c-border);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus {
  @apply ring-2 border-transparent outline-none;
  --tw-ring-color: var(--c-text-brand);
}
</style>
