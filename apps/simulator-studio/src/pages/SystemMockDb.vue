<template>
  <div>
    <h1 class="text-xl mb-4">Mock DB / Мок БД</h1>

    <section class="mb-6">
      <h2 class="font-semibold mb-2">Autosave & Journal / Автосохранение и журнал</h2>
      <div class="space-y-2">
        <label class="flex items-center space-x-2">
          <input type="checkbox" :checked="store.autosaveEnabled" @change="store.toggleAutosave" />
          <span>{{ store.autosaveEnabled ? 'On / Вкл' : 'Off / Выкл' }}</span>
        </label>
        <label class="flex items-center space-x-2">
          <input type="checkbox" :checked="store.journalEnabled" @change="store.toggleJournal" />
          <span>Journal / Журнал</span>
        </label>
      </div>
    </section>

    <section>
      <div class="flex justify-between items-center mb-2">
        <h2 class="font-semibold">Snapshots / Снапшоты</h2>
        <div class="space-x-2">
          <button class="border px-2 py-1" @click="store.saveCurrent">Save current / Сохранить</button>
          <button class="border px-2 py-1" @click="store.listSnapshots">Refresh / Обновить</button>
        </div>
      </div>
      <Table>
        <template #head>
          <th class="text-left">Name</th>
          <th class="text-left">Created</th>
          <th class="text-left">Size</th>
          <th></th>
        </template>
        <tr v-for="s in store.snapshots" :key="s.name" class="hover:bg-gray-50">
          <td>{{ s.name }}</td>
          <td>{{ new Date(s.created).toLocaleString() }}</td>
          <td>{{ s.size }}</td>
          <td class="space-x-2">
            <button class="underline" @click="store.load(s.name)">Load / Загрузить</button>
            <button class="underline" @click="store.download(s.name)">Export / Экспорт</button>
            <button class="underline" @click="store.remove(s.name)">Delete / Удалить</button>
          </td>
        </tr>
      </Table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Table from '../components/Table.vue'
import { useMockDbStore } from '../stores/mockdb'

const store = useMockDbStore()

onMounted(() => {
  store.listSnapshots()
})
</script>
