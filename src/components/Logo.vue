
<template>
  <div :style="{ height: height + 'px' }" class="inline-flex items-center">
    <svg :height="height" :width="Math.round(height*2.125)" viewBox="0 0 270 127" xmlns="http://www.w3.org/2000/svg" aria-label="Trickster logo">
      <g clip-path="url(#clip0)">
        <rect width="126" height="32" :fill="greenLight"/><rect x="142" width="32" height="127" :fill="orangeLight"/><rect x="190" width="32" height="127" :fill="orangeLight"/><rect x="238" width="32" height="127" :fill="orangeLight"/>
      </g>
      <defs><clipPath id="clip0"><rect width="270" height="127" fill="white"/></clipPath></defs>
    </svg>
  </div>
</template>
<script setup>
const props = defineProps({ height: { type: Number, default: 18 } })
const greenLight = 'var(--logo-primary, var(--c-text-brand))'
const orangeLight = 'var(--logo-accent, var(--c-text-accent))'
</script>
