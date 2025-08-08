<template>
  <div class="p-10 flex flex-col h-full bg-secondary">
    <header class="mb-4">
      <h2 class="text-2xl font-bold text-default mb-1">{{ file.name }}</h2>
      <p class="text-muted capitalize">{{ file.type }}</p>
    </header>
    <div class="flex-1 overflow-y-auto">
      <!-- Text file preview -->
      <template v-if="file.type === 'text'">
        <pre class="whitespace-pre-wrap text-default font-mono p-4 bg-input rounded-lg border border-default">
          {{ file.content || file.details }}
        </pre>
      </template>
      <!-- PDF file preview -->
      <template v-else-if="file.type === 'pdf'">
        <template v-if="file.content">
          <!-- Embed the PDF directly if its base64 content is available -->
          <div class="flex-1">
            <iframe
              :src="file.content"
              class="w-full h-full border border-default rounded-lg"
              title="PDF preview"
            ></iframe>
          </div>
        </template>
        <template v-else>
          <!-- Fallback: show an icon and offer to open the file in a new tab -->
          <div class="flex flex-col items-center justify-center space-y-2">
            <span class="material-icons-outlined text-6xl text-muted">picture_as_pdf</span>
            <a
              :href="file.details"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-primary"
            >
              {{ langStore.t('openInNewTab') }}
            </a>
          </div>
        </template>
      </template>
      <!-- URL file preview -->
      <template v-else-if="file.type === 'url'">
        <p class="mb-2 text-default">
          <a :href="file.name" target="_blank" rel="noopener noreferrer" class="text-brand underline break-all">
            {{ file.name }}
          </a>
        </p>
        <p class="text-muted text-sm">{{ domain }}</p>
        <p class="text-default">Source: {{ file.details }}</p>
      </template>
      <!-- Unknown type fallback -->
      <template v-else>
        <p class="text-muted">{{ langStore.t('unknownFileType') }}</p>
      </template>
    </div>
<footer class="mt-4 pt-4 border-t border-default flex justify-end">
      <div class="flex space-x-3">
        <button @click="updateFile" class="btn-primary">
          {{ langStore.t('updateFile') || 'Update' }}
        </button>
        <button @click="$emit('close')" class="btn-secondary">{{ langStore.t('close') }}</button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import langStore from '@/stores/langStore.js';
import { sidePanelStore } from '@/stores/sidePanelStore.js';
import KnowledgeFileForm from '@/components/KnowledgeFileForm.vue';

const props = defineProps({
  file: Object,
  groupId: [String, Number],
  onSaveSuccess: Function,
});

// Extract the domain from a URL for display.  When the URL cannot be parsed
// the result is an empty string.  This avoids exceptions when the file
// name is not a valid URL.
const domain = computed(() => {
  if (!props.file || props.file.type !== 'url') return '';
  try {
    return new URL(props.file.name).hostname;
  } catch (e) {
    return '';
  }
});

// Trigger opening the KnowledgeFileForm in edit mode to replace/update the current file.
function updateFile() {
  sidePanelStore.open(KnowledgeFileForm, {
    groupId: props.groupId,
    file: props.file,
    onSaveSuccess: () => {
      if (props.onSaveSuccess) props.onSaveSuccess();
    },
  });
}
</script>

<style scoped>
.bg-secondary { background-color: var(--c-bg-secondary); }
.text-default { color: var(--c-text-primary); }
.text-muted { color: var(--c-text-secondary); }
.border-default { border-color: var(--c-border); }
.text-brand { color: var(--c-text-brand); }
</style>
