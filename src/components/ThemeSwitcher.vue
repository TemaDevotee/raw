<template>
  <div class="inline-block">
    <button
      id="theme-trigger"
      data-testid="theme-trigger"
      class="h-10 w-10 p-2 rounded-full text-muted hover:bg-[var(--c-bg-hover)] hover:text-[var(--c-text-accent)] focus-visible:outline-none"
      aria-haspopup="menu"
      :aria-expanded="open.toString()"
      :aria-label="t('theme')"
      @click="onClick"
    >
      <span class="material-icons-outlined">palette</span>
    </button>
    <Popover v-model:open="open" :anchor="anchor" placement="top-end">
      <ul class="p-1" role="none">
        <li v-for="th in themeStore.themes" :key="th.id">
          <button
            type="button"
            role="menuitem"
            class="flex items-center gap-2 w-full px-3 py-2 rounded text-left hover:bg-[var(--c-bg-hover)]"
            :aria-checked="(themeStore.currentTheme === th.id).toString()"
            :data-testid="`theme-item-${th.name}`"
            @click="selectTheme(th.id)"
          >
            <span class="flex-1">{{ t(th.id) }}</span>
            <span v-if="themeStore.currentTheme === th.id" class="material-icons-outlined text-sm">check</span>
          </button>
        </li>
        <li class="mt-1 pt-1 border-t border-[var(--popover-border)]">
          <button
            type="button"
            role="menuitem"
            class="flex items-center gap-2 w-full px-3 py-2 rounded text-left hover:bg-[var(--c-bg-hover)]"
            @click="toggleMode"
          >
            <span class="flex-1">{{ t(themeStore.isDarkMode ? 'lightMode' : 'darkMode') }}</span>
            <span class="material-icons-outlined text-sm">{{ themeStore.isDarkMode ? 'light_mode' : 'dark_mode' }}</span>
          </button>
        </li>
      </ul>
    </Popover>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Popover from './ui/Popover.vue'
import { themeStore } from '@/stores/ThemingStore'
import langStore from '@/stores/langStore'

const open = ref(false)
const anchor = ref(null)

function t(key) {
  return langStore.t(key)
}

function onClick(e) {
  anchor.value = e.currentTarget
  open.value = true
}

function selectTheme(id) {
  themeStore.setTheme(id)
  open.value = false
}

function toggleMode() {
  themeStore.toggleDarkMode()
  open.value = false
}
</script>
