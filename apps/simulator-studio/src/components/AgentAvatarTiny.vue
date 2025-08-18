<template>
  <div class="avatar" :style="avatarStyle" :title="name">
    <img v-if="src" :src="src" :alt="name" />
    <span v-else>{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{ src?: string; name?: string; size?: number }>(),
  { size: 18 }
);

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

const initials = computed(() =>
  (props.name || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
);

const bg = computed(() => `hsl(${hash(props.name || '') % 360} 60% 60%)`);

const avatarStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: 'var(--agent-badge-radius)',
  overflow: 'hidden',
  background: props.src ? 'transparent' : bg.value,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: `${props.size * 0.6}px`,
}));
</script>

<style scoped>
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
