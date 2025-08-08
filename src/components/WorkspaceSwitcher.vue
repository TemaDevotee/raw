<template>
  <div
    class="relative switcher-container"
    :class="{ open: open }"
    ref="root"
  >
    <!-- Trigger -->
    <button :id="'ws-option-'+(current?.id || '')"
      ref="trigger"
      type="button"
      class="w-full flex items-center justify-between p-2 rounded hover-bg-effect min-h-[44px] text-base font-medium focus:outline-none"
      :aria-expanded="open.toString()"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="truncate">{{ current?.name }}</span>
      <span
        class="material-icons transition-transform"
        :class="{ 'rotate-180': open }"
        aria-hidden="true"
        >expand_more</span
      >
    </button>
    <!-- Dropdown sheet -->
    <div
      v-show="open"
      ref="sheet"
      class="sheet absolute z-50 mt-2 w-56 bg-secondary border border-default rounded-lg shadow max-h-60 overflow-y-auto focus:outline-none"
      :class="{ open: open }"
      @keydown="onListKeydown"
    >
      <div v-if="workspaces.length > 7" class="p-2">
        <input
          v-model="query"
          type="text"
          placeholder="Поиск"
          class="w-full p-2 rounded border"
          @keydown.stop
        />
      </div>
      <ul role="listbox" ref="list" :aria-activedescendant="'ws-option-'+(filtered[focusIndex]?.id||'')">
        <li v-for="(ws, index) in filtered" :key="ws.id">
          <button
            :ref="(el) => setItemRef(el, index)"
            type="button"
            role="option"
            :aria-selected="current?.id === ws.id"
            class="flex items-center justify-between w-full px-3 py-2 text-base font-medium hover:bg-hover text-left min-h-[44px] focus:outline-none"
            @click="select(ws.id)"
          >
            <span class="truncate">{{ ws.name }}</span>
            <span v-if="!ws.isDefault" class="flex gap-1 ml-2">
              <span
                class="material-icons text-base hover:text-brand"
                @click.stop="promptRename(ws)"
                :title="langStore.t('rename') || 'Rename'"
                >edit</span
              >
              <span
                class="material-icons text-base hover:text-red-500"
                @click.stop="confirmDelete(ws)"
                :title="langStore.t('delete') || 'Delete'"
                >delete</span
              >
            </span>
          </button>
        </li>
      </ul>
    
      <div class="p-2 border-t border-default">
        <button type="button" class="w-full px-3 py-2 rounded-lg bg-[var(--c-bg-primary)] hover:bg-hover" @click="createWs">
          <span class="material-icons text-base align-[-2px] mr-1">add</span> {{ langStore.t('addWorkspace') || 'Add workspace' }}
        </button>
      </div>
</div>
    <!-- Confirmation dialog -->
    <ConfirmDialog
      v-if="dialog"
      v-bind="dialog"
      @confirm="dialog.onConfirm"
      @cancel="dialog = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { workspaceStore } from '@/stores/workspaceStore'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import langStore from '@/stores/langStore.js'

// State for open/closed state, search query and confirmation dialog
const open = ref(false)
const query = ref('')
const dialog = ref(null)
// Refs to DOM elements
const root = ref(null)
const trigger = ref(null)
const sheet = ref(null)
const list = ref(null)
const itemRefs = ref([])

// Expose workspaces and current workspace from the store
const workspaces = workspaceStore.state.workspaces
const current = computed(() =>
  workspaces.find((w) => w.id === workspaceStore.state.currentWorkspaceId),
)
const filtered = computed(() =>
  workspaces.filter((w) =>
    w.name.toLowerCase().includes(query.value.toLowerCase()),
  ),
)

// Keep track of the currently focused index when navigating with the keyboard
const focusIndex = ref(-1)

function setItemRef(el, index) {
  if (el) {
    itemRefs.value[index] = el
  }
}

function openList() {
  open.value = true
  // Reset search query on each open
  query.value = ''
  // Focus the current workspace or first item after DOM update
  nextTick(() => {
    const currentIndex = filtered.value.findIndex((w) => w.id === current.value?.id)
    focusIndex.value = currentIndex !== -1 ? currentIndex : 0
    const el = itemRefs.value[focusIndex.value]
    el?.focus()
  })
}

function closeList() {
  open.value = false
  // Return focus to the trigger
  trigger.value?.focus()
}

function toggle() {
  if (open.value) closeList()
  else openList()
}

function select(id) {
  workspaceStore.switchWorkspace(id)
  closeList()
}


function createWs(){
  const name = prompt(langStore.t('workspaceName') || 'Workspace name', 'Workspace ' + (workspaces.length+1));
  const ws = workspaceStore.createWorkspace(name && name.trim() ? name.trim() : undefined);
  closeList();
}
// Rename workspace via prompt
function promptRename(ws) {
  const name = prompt('Новое имя workspace', ws.name)
  if (name && name.trim()) {
    workspaceStore.renameWorkspace(ws.id, name.trim())
  }
}

// Show delete confirmation for non-default workspaces
function confirmDelete(ws) {
  dialog.value = {
    title: 'Удалить workspace?',
    body: 'Это действие нельзя отменить. Все чаты и команды этого workspace будут удалены.',
    confirmLabel: 'Удалить',
    cancelLabel: 'Отмена',
    onConfirm: () => {
      workspaceStore.deleteWorkspace(ws.id)
      dialog.value = null
    },
  }
}

// Click outside to close the sheet
function handleClickOutside(e) {
  if (open.value && root.value && !root.value.contains(e.target)) {
    closeList()
  }
}

// Keyboard handling on the trigger button
function onTriggerKeydown(e) {
  switch (e.key) {
    case 'ArrowDown':
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (!open.value) {
        openList()
      }
      break
    case 'ArrowUp':
      e.preventDefault()
      if (!open.value) {
        openList()
      }
      break
  }
}

// Keyboard handling within the list
function onListKeydown(e) {
  const count = filtered.value.length
  if (e.key === 'Escape') {
    e.preventDefault()
    closeList()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusIndex.value = (focusIndex.value + 1 + count) % count
    itemRefs.value[focusIndex.value]?.focus()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusIndex.value = (focusIndex.value - 1 + count) % count
    itemRefs.value[focusIndex.value]?.focus()
  } else if (e.key === 'Home') {
    e.preventDefault()
    focusIndex.value = 0
    itemRefs.value[0]?.focus()
  } else if (e.key === 'End') {
    e.preventDefault()
    focusIndex.value = count - 1
    itemRefs.value[focusIndex.value]?.focus()
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const ws = filtered.value[focusIndex.value]
    if (ws) {
      select(ws.id)
    }
  } else if (/^[a-zA-Z0-9]$/.test(e.key)) {
    // Type-ahead search: find first item starting with typed letter after current index
    const start = focusIndex.value + 1
    const idx = filtered.value.findIndex((w, i) =>
      i >= start && w.name.toLowerCase().startsWith(e.key.toLowerCase()),
    )
    if (idx !== -1) {
      focusIndex.value = idx
      itemRefs.value[idx]?.focus()
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Container transitions: when open we translate upward and scale slightly.  Use custom easing per spec. */
.switcher-container {
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 240ms cubic-bezier(0.22, 1, 0.36, 1);
}
.switcher-container.open {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Sheet transitions: fade and rise into view.  Use the specified easing. */
.sheet {
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
  transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* Basic colors and hover states. */
.bg-secondary {
  background-color: var(--c-bg-secondary);
}
.border-default {
  border-color: var(--c-border);
}
.hover\:bg-hover:hover,
.hover-bg-effect:hover {
  background-color: var(--c-bg-hover);
  color: var(--c-text-accent);
}

/* Hide transitions for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .switcher-container,
  .sheet {
    transition: none;
    transform: none !important;
  }
}
</style>
