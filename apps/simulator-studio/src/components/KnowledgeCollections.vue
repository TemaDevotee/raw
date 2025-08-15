<template>
  <div>
    <div class="mb-4">
      <ProgressBar :percent="percent" />
      <p class="text-xs mt-1">{{ usedMB.toFixed(2) }} / {{ quotaMB }} MB</p>
    </div>
    <ul>
      <li v-for="c in collections" :key="c.id" class="mb-1">
        <button @click="$emit('select', c.id)" :class="c.id === current ? 'font-bold' : ''">
          {{ c.name }} ({{ c.filesCount }})
        </button>
      </li>
    </ul>
    <p v-if="!collections.length" class="text-sm">No collections / Нет коллекций</p>
    <button class="underline mt-2" @click="$emit('new')">New Collection / Новая коллекция</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from './ProgressBar.vue'
const props = defineProps<{ collections: any[]; current: string | null; usedMB: number; quotaMB: number }>()
const percent = computed(() => (props.quotaMB ? Math.min(100, (props.usedMB / props.quotaMB) * 100) : 0))
</script>
