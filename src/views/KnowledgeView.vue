<template>
  <div class="px-6 py-4 flex gap-8">
    <div class="w-1/3">
      <div class="flex justify-between items-center mb-2">
        <h2 class="font-semibold text-default">{{ t('knowledgeCollections') }}</h2>
        <button class="btn-primary" @click="createCollection">{{ t('knowledgeAdd') }}</button>
      </div>
      <ul>
        <li
          v-for="c in store.state.collections"
          :key="c.id"
          @click="select(c)"
          :class="rowClass(c.id)"
        >
          <span>{{ c.name }}</span>
          <ActionMenu :items="collectionMenu(c)">
            <button class="action-btn">
              <span class="material-icons-outlined text-base">more_vert</span>
            </button>
          </ActionMenu>
        </li>
      </ul>
    </div>
    <div class="flex-1">
      <div v-if="selected">
        <div class="flex justify-between items-center mb-2">
          <h2 class="font-semibold text-default">{{ t('knowledgeSources') }}</h2>
          <button class="btn-secondary" @click="addUrl">{{ t('knowledgeAddUrl') }}</button>
        </div>
        <ul v-if="sources.length">
          <li v-for="s in sources" :key="s.id" class="p-2 border-b border-default">{{ s.name }}</li>
        </ul>
        <div v-else class="text-muted py-8 text-center">
          {{ t('knowledgeNoSources') }}
        </div>
      </div>
      <div v-else class="text-muted py-8 text-center">{{ t('knowledgeNoSources') }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { knowledgeStore } from '@/stores/knowledgeStore'
import langStore from '@/stores/langStore'
import ActionMenu from '@/components/ui/ActionMenu.vue'

const store = knowledgeStore
const t = langStore.t
const selectedId = ref(null)

onMounted(() => {
  store.fetchCollections()
})

const selected = computed(() =>
  store.state.collections.find((c) => c.id === selectedId.value)
)
const sources = computed(
  () => store.state.sourcesByCollection[selectedId.value] || []
)

function select(c) {
  selectedId.value = c.id
  store.fetchSources(c.id)
}

function createCollection() {
  const name = prompt(t('name'))
  if (name) {
    store.createCollection(name)
  }
}

function collectionMenu(c) {
  return [
    {
      id: 'rename',
      labelKey: 'rename',
      onSelect: () => {
        const n = prompt(t('rename'), c.name)
        if (n) store.renameCollection(c.id, n)
      },
    },
    {
      id: 'delete',
      labelKey: 'delete',
      danger: true,
      confirm: { titleKey: 'confirmDeleteTitle', bodyKey: 'confirmDeleteBody' },
      onSelect: () => {
        store.deleteCollection(c.id)
        if (selectedId.value === c.id) selectedId.value = null
      },
    },
  ]
}

function addUrl() {
  const url = prompt('URL')
  if (url) store.addUrlSource(selectedId.value, url)
}

function rowClass(id) {
  return [
    'p-2 rounded flex justify-between items-center cursor-pointer',
    selectedId.value === id ? 'bg-selected' : 'hover:bg-hover',
  ]
}
</script>

<style scoped>
.bg-selected {
  background-color: var(--c-bg-muted);
}
.bg-hover {
  background-color: var(--c-bg-hover);
}
.action-btn {
  @apply p-2 rounded-full transition-colors;
}
.action-btn:hover {
  background-color: var(--c-bg-hover);
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
</style>
