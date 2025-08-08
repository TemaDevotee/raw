<template>
  <div class="relative" ref="container">
    <!-- Trigger button for language menu -->
    <button
      @click="toggle"
      class="h-10 w-10 p-2 rounded-full text-muted flex items-center justify-center transition-colors duration-200 hover:bg-[var(--c-bg-hover)] hover:text-[var(--c-text-accent)]"
    >
      <span class="material-icons-outlined">language</span>
    </button>
    
    <!-- Dropdown menu -->
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute bottom-full mb-1 left-1/2 transform -translate-x-[55%] w-32 p-2 rounded-xl shadow-lg menu-bg border border-default z-50"
      >
        <div
          @click="setLang('en')"
          class="flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer menu-item"
          :class="{ active: langStore.current === 'en' }"
        >
          English
        </div>
        <div
          @click="setLang('ru')"
          class="flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer menu-item"
          :class="{ active: langStore.current === 'ru' }"
        >
          Русский
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { langStore } from '@/stores/langStore.js';

// Local state to control dropdown visibility
const isOpen = ref(false);
const container = ref(null);
const toggle = () => {
  isOpen.value = !isOpen.value;
};
const setLang = (lang) => {
  langStore.setLang(lang);
  isOpen.value = false;
};

// Close the menu when clicking outside
function onClickOutside(event) {
  if (!container.value) return;
  if (!container.value.contains(event.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside);
});
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
});
</script>

<style scoped>
.menu-bg {
  background-color: var(--c-bg-secondary);
}
.border-default {
  border-color: var(--c-border);
}
.menu-item {
  color: var(--c-text-primary);
}
.menu-item:hover {
  background-color: var(--c-bg-hover);
  color: var(--c-text-accent);
}
.menu-item.active {
  color: var(--c-text-brand);
}
</style>