<template>
  <teleport to="body">
    <div v-if="open" class="fixed inset-0">
      <div
        class="absolute inset-0 bg-black/40"
        @click="close"
        :style="{ zIndex: 'calc(var(--z-popover) - 1)' }"
      />
      <div
        data-testid="drawer"
        ref="panel"
        class="absolute top-0 right-0 h-full bg-[var(--popover-bg)] border-l border-[var(--popover-border)] shadow-lg transition-transform duration-200 z-[var(--z-popover)]"
        :style="{ width, transform: open ? 'translateX(0)' : 'translateX(100%)' }"
        role="dialog"
        :aria-labelledby="ariaLabelledby"
        tabindex="-1"
      >
        <slot />
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  width: { type: String, default: '480px' },
  ariaLabelledby: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue'])
const open = ref(props.modelValue)
const panel = ref(null)

watch(
  () => props.modelValue,
  (v) => {
    open.value = v
    if (v) nextTick(() => panel.value?.focus())
  }
)

function close() {
  emit('update:modelValue', false)
}

function onKey(e) {
  if (e.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<style scoped>
</style>
