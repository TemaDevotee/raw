<template>
  <div class="shell flex">
    <aside class="w-48 p-4 border-r">
      <nav class="space-y-2">
        <NavLink to="/tenants" label-en="Tenants" label-ru="Арендаторы" />
        <NavLink to="/search" label-en="Search" label-ru="Поиск" />
        <NavLink to="/system" label-en="System" label-ru="Система" />
      </nav>
    </aside>
    <div class="flex-1">
      <header class="p-4 border-b flex justify-between items-center">
        <slot name="topbar" />
        <div v-if="auth.user" class="text-sm flex items-center space-x-2">
          <Tag>{{ auth.role }}</Tag>
          <button class="underline" @click="auth.logout()">Logout / Выйти</button>
        </div>
      </header>
      <main class="p-4">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import NavLink from './NavLink.vue'
import Tag from './Tag.vue'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>

<style scoped>
.shell {
  min-height: 100vh;
}
</style>
