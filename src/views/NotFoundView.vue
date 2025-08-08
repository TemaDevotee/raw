<template>
  <div class="flex flex-col items-center justify-center h-full text-center px-10 pt-10">
    <h1 class="text-4xl font-bold mb-4 text-default">404</h1>
    <p class="text-lg text-muted mb-6">{{ langStore.t('pageNotFound') || 'Page not found' }}</p>
    <router-link to="/" class="btn-primary">
      {{ langStore.t('goHome') || 'Go to dashboard' }}
    </router-link>
  </div>
</template>

<script setup>
import langStore from '@/stores/langStore';
</script>

<style scoped>
.text-default {
  color: var(--c-text-primary);
}
.text-muted {
  color: var(--c-text-secondary);
}
</style>