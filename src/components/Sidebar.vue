<template>
  <div
    :class="collapsed ? 'w-20' : 'w-72'"
    class="sidebar h-full flex flex-col transition-all duration-300 overflow-hidden"
  >
    <!-- Top: brand (ссылка на home) и collapse toggle -->
    <div class="flex items-center justify-between py-4 pl-6 pr-4">
      <router-link to="/" class="flex items-center space-x-3"><Logo :height="18"/>
        
        <template v-if="collapsed">
          <!-- When collapsed display an icon instead of the brand name -->
          <span class="material-icons text-2xl">psychology</span>
        </template>
        <template v-else>
          <span class="text-2xl font-bold whitespace-nowrap">Trickster</span>
        </template>
      </router-link>
      <button
        @click="toggleCollapse"
        :aria-expanded="(!collapsed).toString()"
        aria-label="Toggle sidebar navigation"
        aria-controls="sidebar-navigation"
        class="flex items-center justify-center h-10 w-10 rounded-full hover-bg-effect transition-colors"
      >
        <span class="material-icons">
          {{ collapsed ? 'menu_open' : 'menu' }}
        </span>
      </button>
    </div>

    <!-- Navigation: без Dashboard -->
    <nav id="sidebar-navigation" class="flex-1 mt-4" aria-label="Primary">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'nav-link',
          { active: isActiveRoute(item.to), collapsed: collapsed },
        ]"
        :title="collapsed ? t(item.key) : ''"
        :aria-current="isActiveRoute(item.to) ? 'page' : undefined"
      >
        <!-- icon -->
        <span class="material-icons">{{ item.icon }}</span>
        <!-- label only when not collapsed -->
        <span v-if="!collapsed" class="label ml-3">{{ t(item.key) }}</span>
      </router-link>
    </nav>

    <!-- Workspace switcher displayed only when multiple workspaces exist -->
    <div v-if="showSwitcher" class="px-4 mt-4">
      <WorkspaceSwitcher />
    </div>

    <!-- Bottom controls: compact icon buttons in a single row.  Each control
         uses consistent rounded styling and alignment.  When collapsed,
         icons remain centred due to flex container. -->
    <div class="pb-6 px-4 mt-auto">
      <!-- Stack bottom controls vertically with equal spacing.  When the sidebar
           is collapsed, centre the items horizontally. -->
      <div class="flex flex-col gap-2" :class="{ 'items-center': collapsed }">
        <ThemeSwitcher />
        <LanguageSwitcher />
        <button
          @click="themeStore.toggleDarkMode()"
          :title="themeStore.isDarkMode ? t('lightMode') : t('darkMode')"
          class="h-10 w-10 p-2 rounded-full hover-bg-effect text-muted transition-colors flex items-center justify-center"
        >
          <span class="material-icons">
            {{ themeStore.isDarkMode ? 'dark_mode' : 'light_mode' }}
          </span>
        </button>
        <a
          href="/login.html"
          :title="t('logout')"
          class="h-10 w-10 p-2 rounded-full hover-bg-effect text-muted transition-colors flex items-center justify-center"
        >
          <span class="material-icons">logout</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { themeStore } from '@/stores/ThemingStore.js'
import { langStore } from '@/stores/langStore.js'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher.vue'
import { workspaceStore } from '@/stores/workspaceStore'

const collapsed = ref(false)
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

// Navigation items (без Dashboard)
const navItems = [
  { key: 'chats', to: '/chats', icon: 'chat' },
  { key: 'agents', to: '/agents', icon: 'psychology' },
  { key: 'knowledge', to: '/knowledge', icon: 'library_books' },
  { key: 'account', to: '/account', icon: 'account_circle' },
]
const route = useRoute()
const isActiveRoute = (to) => {
  return route.path === to || route.path.startsWith(to + '/')
}

const t = langStore.t

const showSwitcher = computed(() => workspaceStore.hasMultiple())
</script>

<style scoped>
.sidebar {
  background-color: var(--c-bg-sidebar);
  border-right: 1px solid var(--c-border);
}
.nav-link {
  display: flex;
  align-items: center;
  height: 3rem;
  padding-left: 1.25rem;
  padding-right: 1rem;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: var(--c-text-primary);
  border-radius: 0.75rem;
  /* Smoothly animate padding changes when collapsing/expanding.  We also
     animate justify-content using margin as fallback because justify cannot
     be transitioned. */
  transition:
    background-color 0.15s,
    color 0.15s,
    padding 0.3s ease;
}
.nav-link.collapsed {
  /* When collapsed we center the icon and remove horizontal padding so icons don't jump */
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}
.nav-link:hover {
  background-color: var(--c-bg-hover);
  color: var(--c-text-accent);
}
.nav-link.active {
  background-color: var(--c-bg-hover);
  color: var(--c-text-accent);
}
.material-icons {
  font-size: 20px;
}

/* Ensure hover-bg-effect is available for icon buttons in the sidebar.  This
   class applies a hover background and accent colour defined by the theme. */
.hover-bg-effect:hover {
  background-color: var(--c-bg-hover);
  color: var(--c-text-accent);
}
</style>
