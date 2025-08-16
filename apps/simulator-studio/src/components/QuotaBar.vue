<template>
  <div class="w-full bg-slate-800 rounded h-2">
    <div class="bg-blue-500 h-2 rounded" :style="{ width: percent + '%' }"></div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ used?: number; quota?: number }>()
const percent = computed(() => {
  const u = props.used ?? 0
  const q = props.quota ?? 100
  return Math.min(100, Math.round((u / Math.max(1, q)) * 100))
})
</script>
