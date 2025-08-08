<template>
  <div class="w-full h-full p-4 space-y-4">
    <div class="h-10 rounded-lg bg-loader animate-pulse"></div>
    <div v-for="i in 3" :key="i" class="h-14 rounded-lg bg-loader animate-pulse"></div>
  </div>
</template>

<script setup>
// Skeleton component for loading states
</script>

<style scoped>
.bg-loader {
    background-color: var(--c-border);
    opacity: 0.5;
}
</style>
