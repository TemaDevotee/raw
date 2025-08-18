<template>
  <div class="w-48" :title="tooltip">
    <div class="h-2 rounded bg-neutral-700 overflow-hidden">
      <div class="h-full" :class="barClass" :style="{ width: pct + '%' }"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ balance: number; included: number }>();
const used = computed(() => Math.max(0, props.included - props.balance));
const pct = computed(() => Math.min(100, Math.round((used.value / props.included) * 100)));
const barClass = computed(() => {
  if (pct.value < 70) return 'bg-primary-500';
  if (pct.value < 90) return 'bg-amber-500';
  return 'bg-red-500';
});
const tooltip = computed(() => `${used.value} of ${props.included} tokens used (${pct.value}%)`);
</script>
