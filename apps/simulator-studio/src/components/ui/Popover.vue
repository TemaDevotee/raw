<template>
  <teleport to="body">
    <transition name="fade-pop">
      <div
        v-if="open"
        ref="content"
        class="popover"
        :style="style"
        role="menu"
        :aria-labelledby="anchorEl?.id"
        @focusout="onFocusOut"
      >
        <slot />
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  anchor: { type: Object, default: null },
  placement: { type: String, default: 'top-end' },
  offsetMain: { type: Number, default: 8 },
  offsetCross: { type: Number, default: 8 },
});

const emit = defineEmits(['update:open', 'close']);

const content = ref<HTMLElement | null>(null);
const style = ref<Record<string, string>>({});
const anchorEl = ref<HTMLElement | null>(null);
let lastFocused: HTMLElement | null = null;

function getAnchorEl(): HTMLElement | null {
  return props.anchor || null;
}

function updatePosition() {
  const anchor = getAnchorEl();
  anchorEl.value = anchor;
  if (!anchor || !content.value) return;
  const rect = anchor.getBoundingClientRect();
  const menuRect = content.value.getBoundingClientRect();
  const main = props.offsetMain;
  const cross = props.offsetCross;
  let top = 0;
  let left = 0;
  if (props.placement.startsWith('top')) {
    top = rect.top - menuRect.height - main;
  } else {
    top = rect.bottom + main;
  }
  if (props.placement.endsWith('start')) {
    left = rect.left + cross;
  } else {
    left = rect.right - menuRect.width - cross;
  }
  style.value = { top: `${top}px`, left: `${left}px` };
}

function focusFirst() {
  const el = content.value?.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  el && el.focus();
}

function close() {
  emit('update:open', false);
  emit('close');
}

function onDocumentClick(e: MouseEvent) {
  const anchor = getAnchorEl();
  if (
    content.value &&
    !content.value.contains(e.target as Node) &&
    !(anchor && anchor.contains(e.target as Node))
  ) {
    close();
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

function onFocusOut(e: FocusEvent) {
  const anchor = getAnchorEl();
  if (
    content.value &&
    !content.value.contains(e.relatedTarget as Node) &&
    !(anchor && anchor.contains(e.relatedTarget as Node))
  ) {
    close();
  }
}

watch(
  () => props.open,
  async (val) => {
    if (val) {
      lastFocused = getAnchorEl();
      await nextTick();
      updatePosition();
      focusFirst();
      document.addEventListener('mousedown', onDocumentClick);
      document.addEventListener('keydown', onKeydown);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    } else {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onKeydown);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      lastFocused && lastFocused.focus && lastFocused.focus();
    }
  }
);

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentClick);
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
});
</script>

<style scoped>
.popover {
  position: fixed;
  z-index: var(--z-popover);
  border-radius: var(--popover-radius);
  box-shadow: var(--popover-shadow);
  background: var(--popover-bg);
  border: 1px solid var(--popover-border);
}
.fade-pop-enter-from,
.fade-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.fade-pop-enter-active,
.fade-pop-leave-active {
  transition: opacity var(--motion-fast) ease, transform var(--motion-fast) ease;
}
</style>
