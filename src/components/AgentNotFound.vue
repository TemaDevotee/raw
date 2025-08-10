<template>
  <div class="text-center py-16" data-testid="agent-not-found">
    <h3 class="text-xl font-semibold mb-2">{{ t('agent.notFound.title') }}</h3>
    <p class="text-muted mb-4">{{ t('agent.notFound.desc') }}</p>
    <router-link to="/agents" class="btn-primary" data-testid="agent-back">
      {{ t('agents.back') }}
    </router-link>
  </div>
</template>
<script setup>
import langStore from '@/stores/langStore'
const t = langStore.t
</script>
