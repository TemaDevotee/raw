import { ref, nextTick } from 'vue';

export function useStatusMenu(options, onSelect) {
  const open = ref(false);
  const focusIndex = ref(0);
  const triggerRef = ref(null);
  const menuRef = ref(null);
  const itemRefs = ref([]);

  function toggle() {
    open.value = !open.value;
    if (open.value) {
      focusIndex.value = 0;
      nextTick(() => itemRefs.value[0]?.focus());
    } else {
      triggerRef.value?.focus();
    }
  }

  function close() {
    if (open.value) {
      open.value = false;
      triggerRef.value?.focus();
    }
  }

  function onKeydown(e) {
    if (!open.value) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusIndex.value = (focusIndex.value + 1) % options.length;
      nextTick(() => itemRefs.value[focusIndex.value]?.focus());
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusIndex.value = (focusIndex.value + options.length - 1) % options.length;
      nextTick(() => itemRefs.value[focusIndex.value]?.focus());
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(focusIndex.value);
    }
  }

  function select(idx) {
    const opt = options[idx];
    if (!opt) return;
    onSelect(opt.value);
    close();
  }

  function onDocumentClick(e) {
    if (open.value && menuRef.value && !menuRef.value.contains(e.target) && !triggerRef.value.contains(e.target)) {
      close();
    }
  }

  return { open, focusIndex, triggerRef, menuRef, itemRefs, toggle, onKeydown, onDocumentClick, select };
}
