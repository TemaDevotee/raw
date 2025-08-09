<template>
  <ActionMenu :items="menuItems">
    <button
      class="h-10 w-10 p-2 rounded-full text-muted hover:bg-[var(--c-bg-hover)] hover:text-[var(--c-text-accent)] focus-visible:outline-none"
      data-testid="theme-switcher"
    >
      <span class="material-icons-outlined">palette</span>
    </button>
  </ActionMenu>
</template>

<script setup>
import { computed } from 'vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import { themeStore } from '@/stores/ThemingStore'
import langStore from '@/stores/langStore'

const menuItems = computed(() => {
  const themeItems = themeStore.themes.map(t => ({
    id: t.id,
    labelKey: t.name,
    onSelect: () => themeStore.setTheme(t.id),
    disabled: themeStore.currentTheme === t.id
  }))
  return [
    ...themeItems,
    {
      id: 'toggle-dark',
      dividerAbove: true,
      labelKey: themeStore.isDarkMode ? langStore.t('lightMode') : langStore.t('darkMode'),
      onSelect: () => themeStore.toggleDarkMode()
    }
  ]
})
</script>
