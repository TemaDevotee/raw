<template>
  <aside class="w-80 border-l border-slate-800 p-4 flex flex-col gap-3">
    <h2 class="font-semibold">Mock DB Manager / Управление Mock-БД</h2>

    <label class="text-sm opacity-80">Admin key / Админ-ключ</label>
    <input class="w-full p-2 rounded bg-slate-900 border border-slate-700"
           :value="adminKey" @change="setKey(($event.target as HTMLInputElement).value)"
           placeholder="X-Admin-Key" />

    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" :checked="db.autosave" @change="db.setAutosave(($event.target as HTMLInputElement).checked)" />
      Autosave snapshots / Автосохранение
    </label>

    <div class="flex gap-2">
      <button class="btn" @click="db.save()">Save / Сохранить</button>
      <button class="btn" @click="db.reset()">Reset / Сбросить</button>
      <button class="btn" @click="db.export()">Export / Экспорт</button>
    </div>

    <div>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">Snapshots / Снапшоты</h3>
        <button class="btn" @click="db.refreshSnapshots()">Refresh / Обновить</button>
      </div>
      <ul class="mt-2 max-h-60 overflow-auto">
        <li v-for="s in db.snapshots" :key="s" class="flex items-center justify-between py-1">
          <span class="truncate">{{ s }}</span>
          <button class="btn" @click="db.load(s)">Load / Загрузить</button>
        </li>
        <li v-if="!db.snapshots.length" class="opacity-60 text-sm">No snapshots yet / Снапшотов нет</li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDbStore } from '@/stores/db'
const db = useDbStore()
db.refreshSnapshots()
const adminKey = computed(() => localStorage.getItem('studio.adminKey') || import.meta.env.VITE_ADMIN_KEY || '')
function setKey(v: string) { localStorage.setItem('studio.adminKey', v) }
</script>

<style scoped>
.btn { padding:.4rem .6rem; background:#1e2a44; border:1px solid #2b3b63; border-radius:.4rem; }
.btn:hover { background:#233153 }
</style>
