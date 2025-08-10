<template>
  <div class="inline-block">
    <button
      id="lang-trigger"
      data-testid="lang-trigger"
      class="h-10 w-10 p-2 rounded-full text-muted hover:bg-[var(--c-bg-hover)] hover:text-[var(--c-text-accent)] focus-visible:outline-none"
      aria-haspopup="menu"
      :aria-expanded="open.toString()"
      :aria-label="t('language')"
      @click="onClick"
    >
      <span class="material-icons-outlined">language</span>
    </button>
    <Popover v-model:open="open" :anchor="anchor" placement="top-end">
      <ul class="p-1" role="none">
        <li v-for="l in languages" :key="l.code">
          <button
            type="button"
            role="menuitem"
            class="flex items-center gap-2 w-full px-3 py-2 rounded text-left hover:bg-[var(--c-bg-hover)]"
            :data-testid="`lang-item-${l.code}`"
            :aria-checked="(langStore.current === l.code).toString()"
            @click="selectLang(l.code)"
          >
            <span class="flex-1">{{ t(l.labelKey) }}</span>
            <span v-if="langStore.current === l.code" class="material-icons-outlined text-sm">check</span>
          </button>
        </li>
      </ul>
    </Popover>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Popover from './ui/Popover.vue'
import langStore from '@/stores/langStore'

const open = ref(false)
const anchor = ref(null)

const languages = [
  { code: 'en', labelKey: 'langEnglish' },
  { code: 'ru', labelKey: 'langRussian' }
]

function t(key) {
  return langStore.t(key)
}

function onClick(e) {
  anchor.value = e.currentTarget
  open.value = true
}

function selectLang(code) {
  langStore.setLang(code)
  open.value = false
}
</script>
