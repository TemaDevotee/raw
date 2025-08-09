<template>
  <div
    ref="container"
    class="relative overflow-y-auto"
    @scroll="onScroll"
    :style="height ? { height: height + 'px' } : null"
  >
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div
        v-for="item in visibleItems"
        :key="item.key"
        :data-index="item.index"
        :style="{
          position: 'absolute',
          top: item.top + 'px',
          left: 0,
          right: 0
        }"
      >
        <slot :item="item.data" :index="item.index" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { computeWindow } from '@/utils/virtual.js';

const props = defineProps({
  items: { type: Array, default: () => [] },
  itemHeight: { type: Number, required: true },
  overscan: { type: Number, default: 6 },
  height: { type: Number, default: 0 }
});

const container = ref(null);
const scrollTop = ref(0);
const viewportHeight = ref(props.height);

function onScroll(e) {
  scrollTop.value = e.target.scrollTop;
}

function updateHeight() {
  if (container.value && !props.height) {
    viewportHeight.value = container.value.clientHeight;
  }
}

onMounted(() => {
  updateHeight();
  window.addEventListener('resize', updateHeight);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHeight);
});

const totalHeight = computed(() => props.items.length * props.itemHeight);
const windowState = computed(() =>
  computeWindow(props.items.length, props.itemHeight, viewportHeight.value, scrollTop.value, props.overscan)
);
const start = computed(() => windowState.value.start);
const end = computed(() => windowState.value.end);

const visibleItems = computed(() => {
  const out = [];
  for (let i = start.value; i < end.value; i++) {
    const data = props.items[i];
    out.push({
      data,
      index: i,
      top: i * props.itemHeight,
      key: data && typeof data === 'object' && 'key' in data ? data.key : i
    });
  }
  return out;
});
</script>
