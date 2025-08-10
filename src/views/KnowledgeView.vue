<template>
  <div class="px-6 py-4 flex gap-8">
    <div class="w-1/3">
      <div class="flex justify-between items-center mb-2">
        <h2 class="font-semibold text-default">{{ t('knowledgeCollections') }}</h2>
        <button
          class="btn-primary"
          type="button"
          data-testid="knowledge-add-trigger"
          @click="openDrawer = true"
        >
          {{ t('knowledge.add.trigger') }}
        </button>
      </div>
      <ul
        v-if="store.state.collections.length"
        data-testid="knowledge-collections"
      >
        <li
          v-for="c in store.state.collections"
          :key="c.id"
          @click="select(c)"
          :class="rowClass(c.id)"
          data-testid="knowledge-collection-item"
          :data-id="c.id"
        >
          <span>{{ c.name }}</span>
          <ActionMenu :items="collectionMenu(c)">
            <button class="action-btn">
              <span class="material-icons-outlined text-base">more_vert</span>
            </button>
          </ActionMenu>
        </li>
      </ul>
      <div v-else class="text-muted py-16 text-center">
        {{ t('knowledge.noSources') }}
      </div>
    </div>
    <div class="flex-1" v-if="selected">
      <div class="flex justify-between items-center mb-2">
        <h2 class="font-semibold text-default">{{ t('knowledgeSources') }}</h2>
        <ActionMenu :items="addMenu">
          <button class="btn-secondary">{{ t('knowledgeAdd') }}</button>
        </ActionMenu>
      </div>
      <div class="flex gap-4 mb-2 items-end">
        <div>
          <label class="block text-xs mb-1">{{ t('knowledgeType') }}</label>
          <select v-model="typeFilter" class="border rounded p-1 text-sm">
            <option value="all">{{ t('commonAll') }}</option>
            <option value="file">File</option>
            <option value="url">URL</option>
            <option value="qa">Q&A</option>
          </select>
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('knowledgeStatus') }}</label>
          <select v-model="statusFilter" class="border rounded p-1 text-sm">
            <option value="all">{{ t('commonAll') }}</option>
            <option value="queued">{{ t('knowledgeStatusQueued') }}</option>
            <option value="processing">{{ t('knowledgeStatusProcessing') }}</option>
            <option value="ready">{{ t('knowledgeStatusReady') }}</option>
            <option value="error">{{ t('knowledgeStatusError') }}</option>
            <option value="paused">{{ t('knowledgeStatusPaused') }}</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="block text-xs mb-1">{{ t('knowledgeSearch') }}</label>
          <input v-model="search" type="search" class="border rounded p-1 w-full" />
        </div>
        <div class="flex items-center ml-auto" v-if="selection.size">
          <button class="btn-secondary mr-2" @click="batch('reindex')">{{ t('knowledgeBatchReindex') }}</button>
          <button class="btn-secondary mr-2" @click="batch('pause')">{{ t('knowledgeBatchPause') }}</button>
          <button class="btn-secondary mr-2" @click="batch('resume')">{{ t('knowledgeBatchResume') }}</button>
          <button class="btn-danger" @click="batch('delete')">{{ t('knowledgeBatchDelete') }}</button>
        </div>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left border-b border-default">
            <th class="p-2 w-8"><input type="checkbox" :checked="allSelected" @change="toggleAll($event.target.checked)" /></th>
            <th class="p-2">{{ t('name') }}</th>
            <th class="p-2">{{ t('knowledgeStatus') }}</th>
            <th class="p-2">{{ t('updatedAt') }}</th>
            <th class="p-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id" class="border-b border-default">
            <td class="p-2"><input type="checkbox" :checked="selection.has(s.id)" @change="store.selectSource(selected.id, s.id, $event.target.checked)" /></td>
            <td class="p-2">{{ s.name }}</td>
            <td class="p-2">{{ t('knowledgeStatus.' + s.status) }}</td>
            <td class="p-2">{{ s.updatedAt }}</td>
            <td class="p-2 text-right">
              <ActionMenu :items="sourceMenu(s)">
                <button class="action-btn"><span class="material-icons-outlined text-base">more_vert</span></button>
              </ActionMenu>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!filtered.length" class="text-muted py-8 text-center">
        {{ t('knowledgeNoResults') }}
      </div>
    </div>
    <div v-else class="flex-1 text-muted py-8 text-center pointer-events-none">
      {{ t('knowledge.noSources') }}
    </div>
  </div>
  <div v-if="showUpload" class="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
      <SourceUpload :collection-id="selected.id" @uploaded="afterAdd" @close="showUpload=false" />
    </div>
  </div>
  <div v-if="showQA" class="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
      <SourceFormQA :collection-id="selected.id" @added="afterAdd" @close="showQA=false" />
    </div>
  </div>
  <div v-if="showPerms" class="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
      <h3 class="font-semibold mb-2">{{ t('permissions') }}</h3>
      <div class="space-y-2">
        <div>
          <label class="block text-xs mb-1">{{ t('visibility') }}</label>
          <select v-model="permVisibility" class="form-select w-full">
            <option value="private">{{ t('visibilityPrivate') }}</option>
            <option value="workspace">{{ t('visibilityWorkspace') }}</option>
            <option value="public">{{ t('visibilityPublic') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('editors') }}</label>
          <input v-model="permEditors" class="form-input w-full" />
        </div>
      </div>
      <div class="flex justify-end mt-4 space-x-2">
        <button class="btn-secondary" @click="showPerms=false">{{ t('cancel') }}</button>
        <button class="btn-primary" @click="savePerms">{{ t('save') }}</button>
      </div>
    </div>
  </div>
  <SourcePreviewDrawer v-if="previewId" :collection-id="selected.id" :source-id="previewId" @close="previewId=null" />
  <Drawer
    v-model="openDrawer"
    aria-labelledby="drawer-title"
    data-testid="knowledge-add-drawer"
  >
    <div class="p-6 space-y-4">
      <h2 id="drawer-title" data-testid="drawer-title" class="text-lg font-semibold">
        {{ t('knowledge.add.title') }}
      </h2>
      <div>
        <label for="coll-name" class="block text-sm mb-1">{{ t('knowledge.name') }}</label>
        <input
          id="coll-name"
          ref="nameInput"
          data-testid="collection-name-input"
          v-model="form.name"
          class="form-input w-full"
          autofocus
        />
      </div>
      <div>
        <label for="coll-desc" class="block text-sm mb-1">{{ t('knowledge.description') }}</label>
        <input id="coll-desc" v-model="form.description" class="form-input w-full" />
      </div>
      <div>
        <label class="block text-sm mb-1">{{ t('knowledge.visibility') }}</label>
        <select v-model="form.visibility" class="form-select w-full">
          <option value="private">{{ t('knowledge.private') }}</option>
          <option value="workspace">{{ t('knowledge.workspace') }}</option>
        </select>
      </div>
      <div class="flex justify-end">
        <button
          class="btn-primary"
          type="button"
          data-testid="collection-create-submit"
          @click="submit"
          :disabled="!form.name.trim()"
        >
          {{ t('knowledge.add.submit') }}
        </button>
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { knowledgeStore as store } from '@/stores/knowledgeStore'
import langStore from '@/stores/langStore'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import SourceUpload from '@/components/SourceUpload.vue'
import SourceFormQA from '@/components/SourceFormQA.vue'
import SourcePreviewDrawer from '@/components/SourcePreviewDrawer.vue'
import Drawer from '@/components/ui/Drawer.vue'
import { showToast } from '@/stores/toastStore'

const t = langStore.t
const selectedId = ref(null)
const typeFilter = ref('all')
const statusFilter = ref('all')
const search = ref('')
const showUpload = ref(false)
const showQA = ref(false)
const previewId = ref(null)
const showPerms = ref(false)
const permCollection = ref(null)
const permVisibility = ref('workspace')
const permEditors = ref('')
const openDrawer = ref(false)
const form = reactive({ name: '', description: '', visibility: 'private' })
const nameInput = ref(null)

onMounted(() => {
  store.fetchCollections()
})

watch(openDrawer, (v) => {
  if (v) nextTick(() => nameInput.value?.focus())
})

const selected = computed(() => store.state.collections.find((c) => c.id === selectedId.value))
const sources = computed(() => store.state.sourcesByCollection[selectedId.value] || [])
const selection = computed(() => store.state.selectionByCollection[selectedId.value] || new Set())

watch(selectedId, (id) => {
  if (id) store.fetchSources(id)
})

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return sources.value.filter((s) => {
    const matchesType = typeFilter.value === 'all' || s.type === typeFilter.value
    const matchesStatus = statusFilter.value === 'all' || s.status === statusFilter.value
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.url || '').toLowerCase().includes(q) ||
      (s.qa?.question || '').toLowerCase().includes(q) ||
      (s.qa?.answer || '').toLowerCase().includes(q)
    return matchesType && matchesStatus && matchesSearch
  })
})

const allSelected = computed(() => filtered.value.length && filtered.value.every((s) => selection.value.has(s.id)))

function toggleAll(val) {
  if (val) store.selectAll(selectedId.value, filtered.value.map((s) => s.id))
  else store.clearSelection(selectedId.value)
}

async function submit() {
  await store.createCollection({ ...form })
  await nextTick()
  openDrawer.value = false
  showToast(t('created'))
  form.name = ''
  form.description = ''
  form.visibility = 'private'
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
    { id: 'permissions', labelKey: 'permissions', onSelect: () => openPerms(c) },
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

function sourceMenu(s) {
  return [
    { id: 'reindex', labelKey: 'knowledgeReindex', onSelect: () => store.reindexSource(selected.id, s.id) },
    s.status === 'paused'
      ? { id: 'resume', labelKey: 'knowledgeResume', onSelect: () => store.resumeSource(selected.id, s.id) }
      : { id: 'pause', labelKey: 'knowledgePause', onSelect: () => store.pauseSource(selected.id, s.id) },
    { id: 'preview', labelKey: 'knowledgePreview', onSelect: () => (previewId.value = s.id) },
    {
      id: 'delete',
      labelKey: 'knowledgeDelete',
      danger: true,
      confirm: { titleKey: 'confirmDeleteTitle', bodyKey: 'confirmDeleteBody' },
      onSelect: () => store.deleteSources(selected.id, [s.id]),
    },
  ]
}

const addMenu = [
  { id: 'file', labelKey: 'knowledgeAddFile', onSelect: () => (showUpload.value = true) },
  { id: 'url', labelKey: 'knowledgeAddUrl', onSelect: () => addUrl() },
  { id: 'qa', labelKey: 'knowledgeAddQA', onSelect: () => (showQA.value = true) },
]

function addUrl() {
  const url = prompt('URL')
  if (url) store.addUrlSource(selectedId.value, url)
}

function select(c) {
  selectedId.value = c.id
}

function rowClass(id) {
  return [
    'p-2 rounded flex justify-between items-center cursor-pointer',
    selectedId.value === id ? 'bg-selected' : 'hover:bg-hover',
  ]
}

function batch(action) {
  const ids = Array.from(selection.value)
  if (action === 'delete' && !confirm(t('knowledgeDeleteConfirmTitle'))) return
  store.batchAction(selectedId.value, ids, action)
}

function afterAdd() {
  showUpload.value = false
  showQA.value = false
  store.fetchSources(selectedId.value)
}

function openPerms(c) {
  permCollection.value = c
  permVisibility.value = c.visibility || 'workspace'
  permEditors.value = (c.editors || []).join(',')
  showPerms.value = true
}

async function savePerms() {
  const editors = permEditors.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  try {
    await store.updatePermissions(permCollection.value.id, {
      visibility: permVisibility.value,
      editors,
    })
    if (!store.state.collections.find((c) => c.id === permCollection.value.id)) {
      if (selectedId.value === permCollection.value.id) selectedId.value = null
    }
  } catch (e) {
    // ignore for now
  } finally {
    showPerms.value = false
  }
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
