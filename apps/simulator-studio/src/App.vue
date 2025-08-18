<template>
  <div class="h-screen w-screen flex flex-col bg-[#0b0f17] text-slate-100">
    <header class="h-12 flex items-center justify-between px-4 border-b border-slate-800">
      <span>{{ auth.user?.email }}</span>
      <TenantSwitcher />
    </header>
    <div class="flex flex-1">
      <Sidebar />
      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import TenantSwitcher from '@/components/TenantSwitcher.vue'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
</script>

<style>
html,body,#app { margin:0; height:100%; }
</style>
