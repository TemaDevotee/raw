<template>
  <div class="w-full bg-gray-200 rounded">
    <div class="bg-green-500 h-2 rounded" :style="{ width: percent + '%' }"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ percent: number }>()
</script>
