<template>
  <span class="w-4 h-4 inline-block mr-2" :class="iconClass"></span>
</template>
<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ ext?: string }>();
const iconClass = computed(() => {
  switch (props.ext) {
    case 'pdf': return 'bg-red-500';
    case 'jpg':
    case 'png':
    case 'webp': return 'bg-blue-500';
    case 'md':
    case 'txt': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
});
</script>
