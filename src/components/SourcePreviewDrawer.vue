<template>
  <div v-if="open" class="fixed inset-0 bg-black/20 flex" @click.self="close">
    <div class="ml-auto w-80 bg-white dark:bg-gray-800 h-full shadow-lg p-4 overflow-y-auto">
      <button class="float-right" @click="close">✕</button>
      <h3 class="font-semibold mb-4">{{ item.name }}</h3>
      <p class="text-sm mb-2">{{ item.type }}</p>
      <p class="text-sm mb-2">{{ item.updatedAt }}</p>
      <div v-if="item.type === 'url'" class="mb-2">
        <a :href="item.url" class="text-primary" target="_blank">{{ item.url }}</a>
      </div>
      <div v-else-if="item.type === 'qa'" class="mb-2">
        <p class="font-medium">Q: {{ item.qa.question }}</p>
        <p>A: {{ item.qa.answer }}</p>
      </div>
      <div v-else class="mb-2 text-sm text-muted">
        <p>{{ t('knowledgeNoPreview') }}</p>
      </div>
      <div class="mt-4 flex gap-2">
        <button class="btn-secondary" @click="reindex">{{ t('knowledgeReindex') }}</button>
        <button class="btn-danger" @click="del">{{ t('knowledgeDelete') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { knowledgeStore } from '@/stores/knowledgeStore'
import langStore from '@/stores/langStore'

const t = langStore.t
const props = defineProps({
  collectionId: String,
  sourceId: String,
})
const emit = defineEmits(['close'])

const open = computed(() => !!props.sourceId)
const item = computed(() =>
  knowledgeStore.state.sourcesByCollection[props.collectionId]?.find((s) => s.id === props.sourceId) || {},
)

function close() {
  emit('close')
}

function reindex() {
  knowledgeStore.reindexSource(props.collectionId, props.sourceId)
}

function del() {
  knowledgeStore.deleteSources(props.collectionId, [props.sourceId])
  close()
}
</script>
