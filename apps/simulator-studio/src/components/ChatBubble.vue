<template>
  <div :class="[role === 'user' ? 'text-left' : 'text-right', 'mb-2']">
    <div class="text-xs text-gray-500">
      {{ role }} · {{ new Date(ts).toLocaleString() }}
    </div>
    <div class="inline-block px-2 py-1 rounded bg-gray-100">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ role: string; ts: number }>()
</script>
