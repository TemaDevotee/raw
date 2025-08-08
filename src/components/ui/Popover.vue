<template>
  <teleport to="body">
    <div
      v-if="open"
      ref="content"
      class="absolute z-[var(--z-popover,1300)]"
      :style="style"
      @keydown.esc.prevent.stop="emitClose"
    >
      <slot />
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  open: Boolean,
  trigger: Object,
  placement: { type: String, default: 'right' },
  offset: { type: Number, default: 8 }
})
const emit = defineEmits(['close'])
const content = ref(null)
const style = ref({})

function updatePosition() {
  const el = props.trigger?.$el || props.trigger
  if (!el || !content.value) return
  const rect = el.getBoundingClientRect()
  const menuRect = content.value.getBoundingClientRect()
  let x = rect.right + props.offset + window.scrollX
  let y = rect.top + window.scrollY
  if (x + menuRect.width > window.scrollX + window.innerWidth) {
    x = rect.left - props.offset - menuRect.width + window.scrollX
  }
  if (y + menuRect.height > window.scrollY + window.innerHeight) {
    y = window.scrollY + window.innerHeight - menuRect.height - props.offset
  }
  style.value = { top: `${y}px`, left: `${x}px` }
}

function onDocumentClick(e) {
  if (content.value && !content.value.contains(e.target) && !props.trigger?.contains?.(e.target)) {
    emitClose()
  }
}

function onScroll() {
  emitClose()
}

function emitClose() {
  emit('close')
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      nextTick(() => {
        updatePosition()
        document.addEventListener('click', onDocumentClick)
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onScroll)
      })
    } else {
      document.removeEventListener('click', onDocumentClick)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }
)

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
})
</script>
