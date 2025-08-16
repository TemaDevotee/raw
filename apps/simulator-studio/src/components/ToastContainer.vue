<template>
  <div class="fixed bottom-4 right-4 space-y-2">
    <div v-for="t in toasts" :key="t.id" class="px-3 py-2 rounded shadow"
         :class="t.type==='error' ? 'bg-red-700' : 'bg-green-700'">
      {{ t.message }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { toasts } from '@studio/stores/toast';
</script>
