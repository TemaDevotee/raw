<template><span :title="text"><slot /></span></template>
<script setup lang="ts">
defineProps<{ text: string }>()
</script>
