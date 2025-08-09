<template>
  <div>
    <div
      class="border-2 border-dashed rounded p-6 text-center cursor-pointer mb-4"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <p class="mb-2">{{ t('knowledgeDropHere') }}</p>
      <button class="btn-secondary" type="button" @click="pick">{{ t('knowledgeSelectFiles') }}</button>
      <input ref="input" type="file" multiple class="hidden" @change="onChange" accept=".pdf,.docx,.txt,.md,.csv" />
    </div>
    <ul v-if="files.length" class="mb-4">
      <li v-for="f in files" :key="f.name" class="flex justify-between text-sm mb-1">
        <span>{{ f.name }}</span>
        <span>{{ formatSize(f.size) }}</span>
      </li>
    </ul>
    <div class="flex justify-end gap-2">
      <button class="btn-secondary" type="button" @click="emit('close')">{{ t('commonCancel') }}</button>
      <button class="btn-primary" :disabled="!files.length" @click="upload">{{ t('knowledgeUpload') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { knowledgeStore } from '@/stores/knowledgeStore'
import langStore from '@/stores/langStore'

const props = defineProps({
  collectionId: String,
})
const emit = defineEmits(['uploaded', 'close'])

const t = langStore.t
const files = ref([])
const input = ref(null)

function pick() {
  input.value.click()
}

function onChange(e) {
  files.value = Array.from(e.target.files)
}

function onDrop(e) {
  files.value = Array.from(e.dataTransfer.files)
}

function formatSize(size) {
  return `${Math.round(size / 1024)} KB`
}

function upload() {
  knowledgeStore.uploadFiles(props.collectionId, files.value)
  emit('uploaded')
}
</script>
