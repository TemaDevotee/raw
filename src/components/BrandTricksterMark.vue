<script setup>
defineProps({
  size: { type: Number, default: 28 },
  title: { type: String, default: 'Trickster' }
})
</script>

<template>
  <span
    class="inline-flex items-center justify-center"
    :style="{ height: `${size}px` }"
    role="img"
    :aria-label="title"
  >
    <img
      src="/src/assets/brand/trickster.svg"
      :alt="title"
      :style="{ height: `${size}px` }"
      data-testid="logo-trickster"
      decoding="async"
      loading="eager"
    />
  </span>
</template>
