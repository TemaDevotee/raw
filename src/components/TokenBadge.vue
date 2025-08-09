<script setup>
import langStore from '@/stores/langStore.js'
const props = defineProps({ count: { type: Number, required: true } })
</script>

<template>
  <span class="token-badge" data-testid="token-badge">
    {{ langStore.t('tokens.messageUsed', { count: props.count }) }}
  </span>
</template>

<style scoped>
.token-badge {
  font-size: 0.75rem;
  color: var(--c-text-secondary);
}
</style>
