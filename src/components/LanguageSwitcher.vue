<template>
  <ActionMenu :items="items">
    <button class="h-10 w-10 p-2 rounded-full text-muted hover:bg-[var(--c-bg-hover)] hover:text-[var(--c-text-accent)] focus-visible:outline-none">
      <span class="material-icons-outlined">language</span>
    </button>
  </ActionMenu>
</template>

<script setup>
import { computed } from 'vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import langStore from '@/stores/langStore.js'

const items = computed(() => [
  {
    id: 'en',
    labelKey: 'English',
    onSelect: () => langStore.setLang('en'),
    disabled: langStore.current === 'en'
  },
  {
    id: 'ru',
    labelKey: 'Русский',
    onSelect: () => langStore.setLang('ru'),
    disabled: langStore.current === 'ru'
  }
])
</script>
