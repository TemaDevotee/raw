<template>
  <div class="h-screen w-screen flex bg-[#0b0f17] text-slate-100">
    <Sidebar />
    <main class="flex-1 overflow-auto p-6">
      <RouterView />
    </main>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
</script>

<style>
html,body,#app { margin:0; height:100%; }
</style>
