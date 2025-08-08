<template>
  <header class="flex justify-between items-start mb-8 px-10 pt-10">
    <div>
      <!-- Show skeleton until title is ready -->
      <h1 v-if="title" class="text-3xl font-bold text-default">{{ title }}</h1>
      <div v-else class="h-9 w-64 rounded-lg bg-loader animate-pulse"></div>

      <p v-if="subtitle" class="text-muted mt-2">{{ subtitle }}</p>
      <div v-else-if="!title" class="h-5 w-80 rounded-lg bg-loader animate-pulse mt-2"></div>
    </div>
    <div>
      <!-- Slot for buttons -->
      <slot></slot>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String
})
</script>

<style scoped>
.text-default {
  color: var(--c-text-primary);
}
.text-muted {
  color: var(--c-text-secondary);
}
.bg-loader {
  background-color: var(--c-border);
  opacity: 0.5;
}

/* Enhance typography: headings have slightly wider letter spacing for a premium feel,
   while subtitles use tighter spacing for readability. */
h1 {
  letter-spacing: 0.015em;
}
p {
  letter-spacing: 0em;
}
</style>
