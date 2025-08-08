<template>
  <div class="relative" ref="container">
    <!-- Button to open the theme menu -->
    <button
      @click="isOpen = !isOpen"
      class="h-10 w-10 p-2 rounded-full text-muted hover-bg-effect flex items-center justify-center"
    >
      <span class="material-icons-outlined">palette</span>
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
        class="absolute bottom-full mb-1 left-1/2 transform -translate-x-[55%] w-44 p-2 rounded-xl shadow-lg menu-bg border border-default z-50"
      >
        <div
          v-for="theme in themeStore.themes"
          :key="theme.id"
          @click="selectTheme(theme.id)"
          class="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md cursor-pointer menu-item"
          :class="{ active: themeStore.currentTheme === theme.id }"
        >
          <span>{{ theme.name }}</span>
          <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: theme.color }"></div>
        </div>
        <hr class="my-2 border-default" />
        <button @click="themeStore.toggleDarkMode()" class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md menu-item">
          <span>{{ themeStore.isDarkMode ? langStore.t('lightMode') : langStore.t('darkMode') }}</span>
          <span class="material-icons-outlined">{{ themeStore.isDarkMode ? 'light_mode' : 'dark_mode' }}</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { themeStore } from '@/stores/ThemingStore';
import langStore from '@/stores/langStore';

const isOpen = ref(false);
const container = ref(null);

const selectTheme = (themeId) => {
  themeStore.setTheme(themeId);
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

// Assign preview colours to each theme.  These colours reflect the
// primary accent of each palette.  You can adjust them if you tweak
// the palette variables in main.css.
themeStore.themes.forEach((theme) => {
  switch (theme.id) {
    case 'classic':
      theme.color = '#D97706'; // orange accent
      break;
    case 'emerald':
      theme.color = '#059669'; // green accent
      break;
    case 'wine':
      theme.color = '#BE123C'; // wine red accent
      break;
    case 'graphite':
      theme.color = '#0EA5E9'; // sky blue accent
      break;
    case 'sapphire':
      theme.color = '#2563EB'; // deep blue accent
      break;
    case 'violet':
      theme.color = '#7C3AED'; // purple accent
      break;
  }
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
.hover-bg-effect:hover {
  background-color: var(--c-bg-hover);
  color: var(--c-text-accent);
}
</style>
