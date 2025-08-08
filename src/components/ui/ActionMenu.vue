<template>
  <div ref="triggerRef" class="inline-flex" @click.stop="toggle" @keydown.enter.prevent="toggle" @keydown.space.prevent="toggle" aria-haspopup="menu" :aria-expanded="open.toString()">
    <slot />
  </div>
  <Popover v-if="open" :open="open" :trigger="triggerEl" :placement="placement" :offset="offset" @close="close">
    <ul ref="menuRef" role="menu" class="min-w-[200px] rounded-lg border border-default bg-secondary shadow-lg p-2 focus:outline-none" @keydown="onKeydown">
      <li v-for="(item, idx) in items" :key="item.id" :ref="el => itemRefs[idx]=el" role="menuitem" :tabindex="idx===focusIndex?0:-1" :class="['px-3 py-2 flex items-center justify-between rounded', item.disabled?'opacity-50 cursor-not-allowed':'cursor-pointer hover:bg-hover', item.danger && !item.disabled ? 'text-red-600' : '']" @click.stop="onItemClick(item)" @mouseenter="focusIndex=idx" :aria-disabled="!!item.disabled">
        <span class="flex items-center space-x-2">
          <span v-if="item.icon" class="material-icons-outlined text-base">{{ item.icon }}</span>
          <span>{{ t(item.labelKey) }}</span>
        </span>
        <span v-if="item.shortcut" class="text-xs text-muted">{{ item.shortcut }}</span>
      </li>
    </ul>
  </Popover>
  <ConfirmDialog
    v-if="confirmState"
    :title="t(confirmState.titleKey)"
    :body="confirmState.bodyKey ? t(confirmState.bodyKey) : ''"
    :confirm-label="t(confirmState.confirmKey || 'commonConfirm')"
    :cancel-label="t(confirmState.cancelKey || 'commonCancel')"
    @confirm="runConfirmed"
    @cancel="confirmState=null"
  />
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import Popover from './Popover.vue'
import ConfirmDialog from '../ConfirmDialog.vue'
import langStore from '@/stores/langStore'

const props = defineProps({
  items: { type: Array, required: true },
  placement: { type: String, default: 'right' },
  offset: { type: Number, default: 8 }
})
const emit = defineEmits(['open', 'close'])

const open = ref(false)
const triggerRef = ref(null)
const menuRef = ref(null)
const itemRefs = []
const focusIndex = ref(0)
const confirmState = ref(null)
const triggerEl = ref(null)

function t(key) {
  return langStore.t(key) || key
}

function toggle() {
  open.value ? close() : openMenu()
}

function openMenu() {
  window.dispatchEvent(new CustomEvent('action-menu-open', { detail: instanceId }))
  open.value = true
  emit('open')
  nextTick(() => {
    triggerEl.value = triggerRef.value instanceof HTMLElement ? triggerRef.value : triggerRef.value?.$el
    focusIndex.value = 0
    itemRefs[0]?.focus()
  })
}

function close() {
  if (open.value) {
    open.value = false
    emit('close')
    triggerRef.value?.focus()
  }
}

function onKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusIndex.value = (focusIndex.value + 1) % itemsLength
    itemRefs[focusIndex.value]?.focus()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusIndex.value = (focusIndex.value + itemsLength - 1) % itemsLength
    itemRefs[focusIndex.value]?.focus()
  } else if (e.key === 'Home') {
    e.preventDefault(); focusIndex.value = 0; itemRefs[0]?.focus()
  } else if (e.key === 'End') {
    e.preventDefault(); focusIndex.value = itemsLength -1; itemRefs[focusIndex.value]?.focus()
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); onItemClick(props.items[focusIndex.value])
  } else if (e.key === 'Escape') {
    e.preventDefault(); close()
  } else if (e.key.length === 1 && /\w/.test(e.key)) {
    typeBuffer += e.key.toLowerCase()
    clearTimeout(typeTimer)
    typeTimer = setTimeout(() => (typeBuffer = ''), 500)
    const idx = props.items.findIndex(i => t(i.labelKey).toLowerCase().startsWith(typeBuffer))
    if (idx >= 0) {
      focusIndex.value = idx
      itemRefs[idx]?.focus()
    }
  }
}

function onItemClick(item) {
  if (item.disabled) return
  if (item.confirm) {
    confirmState.value = item.confirm
    pendingAction = item.onSelect
  } else {
    item.onSelect?.()
    close()
  }
}

function runConfirmed() {
  pendingAction?.()
  confirmState.value = null
  close()
}

let pendingAction = null
let itemsLength = 0
let typeBuffer = ''
let typeTimer

watch(
  () => props.items,
  (val) => {
    itemsLength = val.length
  },
  { immediate: true }
)

const instanceId = Math.random().toString(36).slice(2)
function onAnotherMenu(e) {
  if (e.detail !== instanceId) close()
}
window.addEventListener('action-menu-open', onAnotherMenu)

onBeforeUnmount(() => {
  window.removeEventListener('action-menu-open', onAnotherMenu)
})
</script>

<style scoped>
.text-muted { color: var(--c-text-secondary); }
.bg-secondary { background-color: var(--c-bg-secondary); }
.hover\:bg-hover:hover { background-color: var(--c-bg-hover); }
.border-default { border-color: var(--c-border); }
.shadow-lg { box-shadow: var(--shadow-lg); }
</style>
