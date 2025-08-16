<template>
  <aside class="p-3 border-l w-80 space-y-3 bg-slate-800">
    <div class="flex justify-between items-center">
      <h3 class="font-semibold">Mock DB</h3>
      <button class="lg:hidden" @click="$emit('close')">✕</button>
    </div>
    <div class="flex items-center gap-2">
      <input type="checkbox" :checked="db.autosave" @change="toggle" :disabled="db.busy" />
      <span>{{ t(lang, 'autosave') }}</span>
    </div>
    <div class="flex gap-2">
      <button @click="save" :disabled="db.busy">{{ t(lang, 'save') }}</button>
      <button @click="reset" :disabled="db.busy">{{ t(lang, 'reset') }}</button>
      <button @click="exportDb" :disabled="db.busy">{{ t(lang, 'export') }}</button>
    </div>
    <div>
      <div class="text-sm opacity-70 mb-1">{{ t(lang, 'snapshots') }}</div>
      <ul class="space-y-1 max-h-56 overflow-auto">
        <li v-for="s in db.snapshots" :key="s" class="flex justify-between items-center">
          <span>{{ s }}</span>
          <button @click="load(s)" :disabled="db.busy">{{ t(lang, 'load') }}</button>
        </li>
      </ul>
    </div>
  </aside>
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import { useDbStore } from '@studio/stores/db';
import { t } from '@/i18n.js';
const db = useDbStore();
const lang = navigator.language.startsWith('ru') ? 'ru' : 'en';
onMounted(() => db.refresh());
function toggle(){ db.toggleAutosave(); }
function save(){ db.saveSnapshot(); }
function load(name:string){ db.loadSnapshot(name); }
function reset(){ db.resetDb(); }
function exportDb(){ db.exportDb(); }
</script>
<style scoped>
button { padding: 6px 10px; border: 1px solid #444; border-radius: 6px; }
</style>
