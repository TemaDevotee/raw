<template>
  <router-link :to="to" class="block px-2 py-1" active-class="font-bold">
    {{ labelEn }} / {{ labelRu }}
  </router-link>
</template>

<script setup lang="ts">
defineProps<{ to: string; labelEn: string; labelRu: string }>()
</script>
