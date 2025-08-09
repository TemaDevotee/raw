<template>
  <div
    v-if="top.length"
    class="flex items-center"
    :data-testid="testid"
    :title="title"
    :aria-label="ariaLabel"
  >
    <div
      v-for="(p, idx) in top"
      :key="p.id"
      class="avatar"
      :style="avatarStyle(idx)"
    >
      <img v-if="p.avatarUrl" :src="p.avatarUrl" alt="" class="w-full h-full rounded-full" />
      <span v-else>{{ initials(p.name) }}</span>
    </div>
    <div v-if="overflow > 0" class="avatar overflow" :style="avatarStyle(top.length)">
      {{ overflowText.replace('{n}', overflow).replace('{count}', overflow) }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { initials } from '@/utils/presence.js'

const props = defineProps({
  participants: { type: Array, default: () => [] },
  max: { type: Number, default: 3 },
  size: { type: Number, default: 18 },
  overflowText: { type: String, default: '+{n}' },
  testid: { type: String, default: '' },
  label: { type: String, default: 'Participants' },
})

const top = computed(() => props.participants.slice(0, props.max))
const overflow = computed(() => Math.max(props.participants.length - props.max, 0))
const names = computed(() => props.participants.slice(0, 5).map((p) => p.name).join(', '))
const title = names
const ariaLabel = computed(() => `${props.label}: ${names.value}`)

function avatarStyle(idx) {
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    zIndex: idx,
    marginLeft: idx ? 'var(--presence-gap)' : '0',
  }
}
</script>

<style scoped>
.avatar {
  border-radius: var(--presence-radius);
  border: var(--presence-border) solid var(--c-bg-primary);
  box-shadow: var(--presence-shadow);
  background-color: var(--c-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  overflow: hidden;
}
</style>
