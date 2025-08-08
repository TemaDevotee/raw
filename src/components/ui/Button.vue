
<template>
  <button
    :type="type"
    class="ui-btn inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold select-none"
    :class="classes"
    v-ripple
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger | icon
  size: { type: String, default: 'md' }, // sm | md | lg
  block: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})
const classes = computed(() => {
  const v = props.variant
  const s = props.size
  return [
    props.block ? 'w-full' : '',
    s === 'sm' ? 'text-sm px-3 py-1.5' : s === 'lg' ? 'text-base px-5 py-3' : 'text-sm px-4 py-2',
    v === 'primary' && 'bg-brand text-white hover:brightness-110 active:brightness-90',
    v === 'secondary' && 'bg-secondary text-default hover:bg-hover active:opacity-90 border border-default',
    v === 'ghost' && 'bg-transparent hover:bg-hover text-default',
    v === 'danger' && 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
    v === 'icon' && 'p-2 rounded-full bg-secondary hover:bg-hover',
    'transition-[filter,background-color,transform,box-shadow] duration-200 ease-[cubic-bezier(.22,1,.36,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-text-brand)]'
  ]
})
</script>
<style scoped>
.ui-btn { min-height: 40px }
</style>
