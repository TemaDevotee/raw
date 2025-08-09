<script setup>
import { computed } from 'vue'
const props = defineProps({
  agent: { type: Object, required: true },
  size: { type: Number, default: null },
})
const initials = computed(() => {
  return (props.agent?.name || '')
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
})
const style = computed(() => {
  if (!props.size) return {}
  const v = `${props.size}px`
  return { width: v, height: v }
})
</script>

<template>
  <div
    class="agent-badge flex items-center justify-center overflow-hidden"
    :title="agent.name"
    :aria-label="`Agent: ${agent.name}`"
    :style="style"
    data-testid="agent-badge"
  >
    <img
      v-if="agent.avatarUrl"
      :src="agent.avatarUrl"
      alt=""
      decoding="async"
      loading="lazy"
      class="w-full h-full object-cover"
    />
    <span
      v-else
      class="w-full h-full flex items-center justify-center text-[10px] font-medium"
      :style="{ backgroundColor: agent.color || 'var(--c-bg-tertiary, #e5e7eb)' }"
    >
      {{ initials }}
    </span>
  </div>
</template>

<style scoped>
.agent-badge {
  width: var(--agent-badge-size);
  height: var(--agent-badge-size);
  border-radius: var(--agent-badge-radius);
  border: var(--agent-badge-border) solid var(--c-bg-secondary);
  box-shadow: var(--agent-badge-shadow);
}
@media (max-width: 640px) {
  .agent-badge {
    width: var(--agent-badge-size-sm);
    height: var(--agent-badge-size-sm);
  }
}
</style>
