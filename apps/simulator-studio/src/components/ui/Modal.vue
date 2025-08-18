<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="bg-neutral-800 text-white p-4 rounded shadow max-h-[80vh] overflow-auto">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ open: boolean }>();
const emit = defineEmits(['close']);
</script>
