<template>
  <div class="flex h-screen">
    <Sidebar
      :class="[
        'transition-transform duration-300 z-50',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'fixed inset-y-0 left-0 sm:static sm:translate-x-0'
      ]"
    />
    <main class="flex-1 flex flex-col overflow-y-auto" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
      <!-- Top bar -->
      <header class="flex justify-between items-center p-4">
        <button
          @click="mobileSidebarOpen = true"
          class="sm:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <span class="material-icons">menu</span>
        </button>
        <div class="flex-1"></div>
        <QuotaBar />
      </header>
      <RouterView />
    </main>
    <SidePanel />
    <!-- Global toast notifications -->
    <ToastNotification />
    <div
      v-if="mobileSidebarOpen"
      class="fixed inset-0 bg-black/50 sm:hidden"
      @click="mobileSidebarOpen = false"
    ></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import SidePanel from '@/components/SidePanel.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import QuotaBar from '@/components/QuotaBar.vue'

const mobileSidebarOpen = ref(false)
let startX = 0, startY = 0, deltaX = 0, swiping = false;
function handleTouchStart(e){ const t=e.changedTouches[0]; startX=t.clientX; startY=t.clientY; deltaX=0; swiping = startX<24 || mobileSidebarOpen.value; }
function handleTouchMove(e){ if(!swiping) return; const t=e.changedTouches[0]; const dy=Math.abs(t.clientY-startY); if(dy>24 && !mobileSidebarOpen.value) { swiping=false; return; } deltaX = t.clientX - startX; }
function handleTouchEnd(){ if(!swiping) return; if(!mobileSidebarOpen.value && deltaX>60){ mobileSidebarOpen.value=true } else if(mobileSidebarOpen.value && deltaX<-60){ mobileSidebarOpen.value=false } swiping=false; }
</script>
