<script setup>
import { computed } from 'vue';

const props = defineProps({ used: Number, quota: Number });
const pct = computed(() => (props.quota ? Math.min(100, Math.round((props.used * 100) / props.quota)) : 0));
const color = computed(() => {
  if (pct.value < 50) return '#16a34a';
  if (pct.value < 90) return '#f59e0b';
  return '#dc2626';
});
</script>

<template>
  <div class="token-bar" :aria-label="`${pct}% of ${props.quota.toLocaleString()} tokens used`">
    <div class="fill" :style="{ width: pct + '%', background: color }"></div>
  </div>
</template>

<style scoped>
.token-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
}
.fill {
  height: 100%;
}
</style>
