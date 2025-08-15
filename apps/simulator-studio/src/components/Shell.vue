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
        <div class="text-sm flex items-center space-x-2">
          <div
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-green-500': rt.status === 'open',
              'bg-yellow-500': rt.status === 'connecting',
              'bg-red-500': rt.status !== 'open' && rt.status !== 'connecting'
            }"
            :title="rt.lastBeatTs ? new Date(rt.lastBeatTs).toLocaleTimeString() : '—'"
          />
          <template v-if="auth.user">
            <Tag>{{ auth.role }}</Tag>
            <button class="underline" @click="auth.logout()">Logout / Выйти</button>
          </template>
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
import { useRealtimeStore } from '../stores/realtime'
const auth = useAuthStore()
const rt = useRealtimeStore()
</script>

<style scoped>
.shell {
  min-height: 100vh;
}
</style>
