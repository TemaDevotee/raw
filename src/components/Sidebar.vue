<template>
  <div
    :class="ui.isCollapsed ? 'w-20' : 'w-72'"
    class="sidebar h-full flex flex-col transition-all duration-300 overflow-hidden"
    data-testid="sidebar"
  >
    <!-- Top: brand link and collapse toggle -->
    <div class="flex items-center justify-between py-4 pl-6 pr-4">
      <router-link to="/" class="flex items-center space-x-3" data-testid="brand-link">
        <span
          v-if="ui.isCollapsed"
          data-testid="sidebar-brand-collapsed"
          data-test="sidebar-collapsed"
          :style="{ color: 'var(--sidebar-brand-color)' }"
        >
          <BrandTricksterMark :size="24" />
        </span>
        <span v-else class="text-2xl font-bold whitespace-nowrap">Trickster</span>
      </router-link>
      <button
        @click="ui.toggleSidebar()"
        :aria-label="ui.isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')"
        data-testid="sidebar-toggle"
        class="sidebar-toggle group inline-flex items-center justify-center"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          class="transition-transform duration-150"
          :style="{ transform: ui.isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }"
          aria-hidden="true"
        >
          <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
        </svg>
      </button>
    </div>

    <!-- Navigation: without Dashboard -->
    <nav id="sidebar-navigation" class="flex-1 mt-4" aria-label="Primary">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['nav-link', { active: isActiveRoute(item.to), collapsed: ui.isCollapsed }]"
          :title="ui.isCollapsed ? t(item.key) : ''"
          :aria-current="isActiveRoute(item.to) ? 'page' : undefined"
        >
          <!-- icon -->
          <span class="material-icons">{{ item.icon }}</span>
          <!-- label only when not collapsed -->
          <span v-if="!ui.isCollapsed" class="label ml-3">{{ t(item.key) }}</span>
        </router-link>
      </nav>

    <footer class="pb-6 px-4 mt-auto sidebar__footer">
      <WorkspaceSwitcher
        v-if="showSwitcher"
        data-testid="workspace-switcher"
        class="mb-4"
      />
        <div class="flex flex-col gap-2" :class="{ 'items-center': ui.isCollapsed }">
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
        <button
          @click="attemptLogout"
          :title="t('logout')"
          class="h-10 w-10 p-2 rounded-full hover-bg-effect text-muted transition-colors flex items-center justify-center"
          data-testid="btn-logout"
        >
          <span class="material-icons">logout</span>
        </button>
      </div>
    </footer>
  </div>
  <ConfirmDialog
    v-if="showConfirm"
    :title="t('logoutConfirmTitle')"
    :body="confirmBody"
    :confirm-label="t('yes')"
    :cancel-label="t('no')"
    @confirm="doLogout"
    @cancel="showConfirm = false"
    data-testid="logout-confirm"
  />
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
import BrandTricksterMark from '@/components/BrandTricksterMark.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { orchestratedLogout, getLogoutRisk } from '@/stores/logout.js'
import { uiStore as ui } from '@/stores/uiStore.js'

const showConfirm = ref(false)
const confirmBody = ref('')

function attemptLogout() {
  const { controlCount, draftCount } = getLogoutRisk()
  if (controlCount || draftCount) {
    const parts = []
    if (controlCount)
      parts.push(
        langStore.t('logoutHoldChats').replace('{n}', String(controlCount))
      )
    if (draftCount)
      parts.push(
        langStore.t('logoutDrafts').replace('{n}', String(draftCount))
      )
    confirmBody.value = parts.join('\n')
    showConfirm.value = true
  } else {
    orchestratedLogout()
  }
}

function doLogout() {
  showConfirm.value = false
  orchestratedLogout()
}

// Navigation items (без Dashboard)
const navItems = [
  { key: 'chats', to: '/chats', icon: 'chat' },
  { key: 'agents.title', to: '/agents', icon: 'psychology' },
  { key: 'knowledgeNav', to: '/knowledge', icon: 'library_books' },
  { key: 'account', to: '/account', icon: 'account_circle' },
]
const route = useRoute()
const isActiveRoute = (to) => {
  return route.path === to || route.path.startsWith(to + '/')
}

const t = langStore.t

const showSwitcher = computed(
  () => workspaceStore.hasMultiple?.() ?? (workspaceStore.workspaces?.length > 1),
)
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

.sidebar-toggle {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  color: var(--c-text-secondary);
  background: var(--c-bg-secondary);
}
.sidebar-toggle:hover {
  background: var(--c-bg-hover);
}
.sidebar-toggle:focus-visible {
  outline: 2px solid var(--brand-logo);
  outline-offset: 2px;
}
</style>
