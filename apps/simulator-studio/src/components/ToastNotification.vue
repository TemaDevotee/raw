<template>
  <transition name="fade">
    <div v-if="db.toast" class="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded px-3 py-2">
      {{ db.toast }}
    </div>
  </transition>
</template>
<script setup lang="ts">
import { useDbStore } from '@/stores/db'
const db = useDbStore()
</script>
<style>
.fade-enter-active,.fade-leave-active{ transition: opacity .2s }
.fade-enter-from,.fade-leave-to{ opacity:0 }
</style>
