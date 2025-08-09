<script setup>
import { computed } from 'vue'
import billingStore from '@/stores/billingStore'
import langStore from '@/stores/langStore'

const summary = computed(() => billingStore.state.summary || {})
const usedPct = computed(() => {
  const s = summary.value
  if (!s.includedMonthlyTokens) return 0
  return Math.min(1, s.usedThisPeriod / s.includedMonthlyTokens)
})
const statusClass = computed(() => {
  const pct = billingStore.periodRemainingPct()
  if (pct <= 0) return 'danger'
  if (pct < 0.1) return 'warn'
  return 'ok'
})
</script>

<template>
  <div v-if="summary.includedMonthlyTokens" class="quota-bar" :class="statusClass" data-testid="quota-bar">
    <div class="label">
      {{ langStore.t('tokens.usedOf', { used: summary.usedThisPeriod, included: summary.includedMonthlyTokens }) }} ·
      {{ langStore.t('tokens.left', { left: summary.totalRemaining }) }}
    </div>
    <div class="bar">
      <div class="bar-inner" :style="{ width: `${usedPct * 100}%` }"></div>
    </div>
  </div>
</template>

<style scoped>
.quota-bar {
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--c-bg-tertiary, #e5e7eb);
  color: var(--c-text-primary);
  width: max-content;
}
.label {
  margin-bottom: 2px;
}
.bar {
  width: 100%;
  height: 4px;
  background: var(--c-border);
  border-radius: 2px;
}
.bar-inner {
  height: 100%;
  border-radius: 2px;
  background: var(--status-color-live);
}
.quota-bar.warn .bar-inner {
  background: var(--status-color-paused);
}
.quota-bar.danger .bar-inner {
  background: var(--status-color-attention);
}
</style>
