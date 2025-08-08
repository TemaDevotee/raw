<template>
  <div class="p-10 flex flex-col h-full bg-secondary">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-default">{{ langStore.t('addKnowledgeSource') }}</h1>
      <p class="text-muted mt-1">{{ langStore.t('chooseType') }}</p>
    </header>
    <form @submit.prevent="saveFile" class="flex-grow flex flex-col min-h-0">
      <!-- Tabs -->
      <div class="mb-6 flex space-x-2 border-b border-default">
        <button
          type="button"
          class="pb-2 px-4 font-medium"
          :class="activeTab === 'upload' ? 'border-b-2 border-brand text-brand' : 'text-muted'"
          @click="activeTab = 'upload'"
        >
          {{ langStore.t('uploadFile') }}
        </button>
        <button
          type="button"
          class="pb-2 px-4 font-medium"
          :class="activeTab === 'text' ? 'border-b-2 border-brand text-brand' : 'text-muted'"
          @click="activeTab = 'text'"
        >
          {{ langStore.t('text') }}
        </button>
        <button
          type="button"
          class="pb-2 px-4 font-medium"
          :class="activeTab === 'url' ? 'border-b-2 border-brand text-brand' : 'text-muted'"
          @click="activeTab = 'url'"
        >
          {{ langStore.t('link') }}
        </button>
      </div>

      <div class="flex-grow space-y-6 overflow-y-auto pr-2 -mr-2">
        <!-- Upload tab content -->
        <div v-if="activeTab === 'upload'" class="space-y-4">
          <!-- Drop zone / file selector -->
          <div
            class="file-drop border-2 border-dashed border-default rounded-lg flex flex-col items-center justify-center p-6 text-center cursor-pointer"
            :class="{ 'ring-2 ring-[var(--c-text-brand)] bg-hover': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="onDragOver"
            @dragenter.prevent="onDragEnter"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
          >
            <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" />
            <template v-if="!uploadedName">
              <span class="material-icons-outlined text-4xl mb-2 text-muted">upload</span>
              <p class="text-muted">{{ langStore.t('dropHere') }}</p>
            </template>
            <template v-else>
              <p class="text-default font-medium">{{ uploadedName }} ({{ uploadedSize }})</p>
              <p class="text-muted text-sm mt-1">{{ langStore.t('dragAnother') }}</p>
            </template>
          </div>
        </div>

        <!-- Text tab content -->
        <div v-else-if="activeTab === 'text'" class="space-y-4">
          <div>
            <label class="form-label">{{ langStore.t('nameLabel') }}</label>
            <input type="text" v-model="textName" class="form-input" placeholder="e.g., FAQ Snippet" required />
          </div>
          <div>
            <label class="form-label">{{ langStore.t('textContentLabel') }}</label>
            <textarea v-model="textContent" rows="6" class="form-input" placeholder="Paste or write the text..." required></textarea>
          </div>
        </div>

        <!-- URL tab content -->
        <div v-else-if="activeTab === 'url'" class="space-y-4">
          <div>
            <label class="form-label">{{ langStore.t('urlLabel') }}</label>
            <input type="url" v-model="linkUrl" class="form-input" placeholder="https://example.com" required />
          </div>
          <div>
            <label class="form-label">{{ langStore.t('urlDescLabel') }}</label>
            <input type="text" v-model="linkDescription" class="form-input" placeholder="e.g., Website sync" />
          </div>
        </div>
      </div>

      <footer class="mt-6 flex justify-end items-center flex-shrink-0 pt-4 border-t border-default">
        <button type="button" @click="maybeClose" class="btn-secondary">{{ langStore.t('cancel') }}</button>
        <button type="submit" class="btn-primary ml-4">{{ langStore.t('add') }}</button>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import apiClient from '@/api';
import langStore from '@/stores/langStore.js';
import { sidePanelStore } from '@/stores/sidePanelStore.js';

// Props for the group ID, an optional existing file (for editing) and
// callback when saved.  When a file is provided, the form will
// prepopulate fields and perform an update (delete + re-create).
const props = defineProps({
  groupId: [String, Number],
  file: Object,
  onSaveSuccess: Function,
});
const emit = defineEmits(['close']);

// Current active tab: 'upload', 'text', or 'url'.  Default is 'upload'.
const activeTab = ref('upload');

// State for upload tab
const uploadedName = ref('');
const uploadedSize = ref('');
let uploadedType = '';
const uploadedContent = ref('');
// Reference to the hidden file input for manual selection
const fileInput = ref(null);

// State for text tab
const textName = ref('');
const textContent = ref('');

// State for URL tab
const linkUrl = ref('');
const linkDescription = ref('');

// Track whether the user is dragging a file over the drop zone.  This
// triggers a visual highlight to improve the drag‑and‑drop affordance.
const isDragging = ref(false);
function onDragOver() {
  isDragging.value = true;
}
function onDragEnter() {
  isDragging.value = true;
}
function onDragLeave() {
  isDragging.value = false;
}

// Define maximum allowed file size (in bytes) and supported types.  Files that
// exceed the size or have unsupported extensions will be rejected with a
// friendly error message.
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['pdf', 'txt', 'text'];

// Process a selected or dropped file: validate, capture metadata and read its contents
function handleFile(file) {
  // Reset drag state
  isDragging.value = false;
  // Validate size
  if (file.size > MAX_SIZE) {
    alert(`File is too large. Please choose a file under ${(MAX_SIZE / (1024 * 1024)).toFixed(1)} MB.`);
    return;
  }
  const parts = file.name.split('.');
  uploadedType = parts.length > 1 ? parts.pop().toLowerCase() : 'file';
  // Validate type
  if (!ALLOWED_TYPES.includes(uploadedType)) {
    alert('Unsupported file type. Only PDF and plain text files are allowed.');
    return;
  }
  uploadedName.value = file.name;
  uploadedSize.value = (file.size / 1024).toFixed(1) + ' KB';
  // Read file content for preview/storage
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedContent.value = e.target.result;
  };
  if (uploadedType === 'pdf') {
    reader.readAsDataURL(file);
  } else {
    reader.readAsText(file);
  }
}

// Handle change event from the hidden file input
function handleFileChange(event) {
  const file = event.target.files && event.target.files[0];
  if (file) handleFile(file);
}

// Handle drag & drop
function onDrop(e) {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  isDragging.value = false;
  if (file) handleFile(file);
}

// Trigger the hidden file input when user clicks the drop area
function triggerFileSelect() {
  if (fileInput.value) fileInput.value.click();
}

// If editing an existing file, populate the form fields based on its
// type.  For 'text' and 'url' we prefill the name and details.  For
// uploaded files we show the existing file name and size to inform
// users that they can optionally replace it by selecting a new file.
onMounted(() => {
  if (props.file) {
    const f = props.file;
    if (f.type === 'text') {
      activeTab.value = 'text';
      textName.value = f.name;
      textContent.value = f.details;
    } else if (f.type === 'url') {
      activeTab.value = 'url';
      linkUrl.value = f.name;
      linkDescription.value = f.details;
    } else {
      // For pdf or plain text files, default to upload tab and show
      // existing file name and size.  Users may choose to replace
      // this file by dropping a new one.
      activeTab.value = 'upload';
      uploadedName.value = f.name;
      uploadedSize.value = f.details;
      uploadedType = f.type;
    }
  }
});

// Save file based on active tab
const saveFile = async () => {
  let payload;
  if (activeTab.value === 'upload') {
    if (!uploadedName.value) {
      alert('Please select a file to upload.');
      return;
    }
    // Determine file type: if extension is pdf use 'pdf', else treat as 'text'
    let type = uploadedType === 'pdf' ? 'pdf' : 'text';
    payload = {
      name: uploadedName.value,
      type,
      details: uploadedSize.value,
      content: uploadedContent.value,
    };
  } else if (activeTab.value === 'text') {
    if (!textName.value || !textContent.value) {
      alert('Please provide a name and content for the text.');
      return;
    }
    payload = {
      name: textName.value,
      type: 'text',
      details: textContent.value,
    };
  } else if (activeTab.value === 'url') {
    if (!linkUrl.value) {
      alert('Please provide a URL.');
      return;
    }
    payload = {
      name: linkUrl.value,
      type: 'url',
      details: linkDescription.value || 'Website link',
    };
  }
  try {
    if (props.file) {
      // When editing, remove the old file and re-add a new one.  This
      // allows us to update the name, details or content without
      // modifying the mock backend.  If the file type was a pdf or
      // text file and the user hasn't provided a new uploadedContent,
      // we keep the existing details.
      try {
        await apiClient.delete(
          `/knowledge_groups/${props.groupId}/files/${props.file.id}`
        );
      } catch (e) {
        console.error('Failed to delete old file during update:', e);
      }
      await apiClient.post(`/knowledge_groups/${props.groupId}/files`, payload);
    } else {
      await apiClient.post(`/knowledge_groups/${props.groupId}/files`, payload);
    }
    if (props.onSaveSuccess) props.onSaveSuccess();
    emit('close');
  } catch (e) {
    console.error('Failed to save file:', e);
  }
};

// Track initial state to detect unsaved changes.  When the user attempts to
// close the form without saving, prompt for confirmation.
const initialState = {
  activeTab: 'upload',
  uploadedName: '',
  textName: '',
  textContent: '',
  linkUrl: '',
  linkDescription: '',
};
const isDirty = () => {
  // Determine if any of the form fields differ from the initial state.
  if (activeTab.value !== initialState.activeTab) return true;
  if (uploadedName.value) return true;
  if (textName.value || textContent.value) return true;
  if (linkUrl.value || linkDescription.value) return true;
  return false;
};
function maybeClose() {
  if (isDirty()) {
    if (confirm(langStore.t('unsavedChanges'))) {
      emit('close');
    }
  } else {
    emit('close');
  }
}

// Register a hook to warn about unsaved changes when the side panel
// closes via overlay or Esc key.  Reset when component unmounts.
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
.bg-secondary {
  background-color: var(--c-bg-secondary);
}
.text-default {
  color: var(--c-text-primary);
}
.text-muted {
  color: var(--c-text-secondary);
}
.border-default {
  border-color: var(--c-border);
}
.form-label {
  @apply block mb-2 text-sm font-medium;
}
/* Modern input styling: pill shape, subtle shadow, smooth focus ring */
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

/* Drag & drop file area */
.file-drop {
  color: var(--c-text-secondary);
}
</style>
