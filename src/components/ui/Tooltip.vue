
<template><div v-show="visible" class="fixed z-[9999] px-2 py-1 text-xs rounded-md bg-black/80 text-white pointer-events-none" :style="{ left: x + 'px', top: y + 'px' }" role="tooltip">{{ text }}</div></template>
<script setup>
import { ref } from 'vue'
const visible=ref(false), text=ref(''), x=ref(0), y=ref(0); let timer
const props = defineProps({ delay: { type: Number, default: 220 } })
function show(t,pos){ clearTimeout(timer); text.value=t; x.value=pos.x; y.value=pos.y; timer=setTimeout(()=> visible.value=true, props.delay) }
function hide(){ clearTimeout(timer); visible.value=false }
defineExpose({ show, hide })
</script>
