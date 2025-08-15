<template>
  <div>
    <UploadDropzone
      v-if="canWrite"
      class="mb-2"
      :progress="progress"
      @upload="f => $emit('upload', f)"
    />
    <Table v-if="files.length">
      <template #head>
        <th class="text-left">Name / Имя</th>
        <th class="text-left">Type / Тип</th>
        <th class="text-left">Size / Размер</th>
        <th class="text-left">Date / Дата</th>
        <th></th>
      </template>
      <tr v-for="f in files" :key="f.id">
        <td>{{ f.name }}</td>
        <td>{{ f.contentType }}</td>
        <td>{{ formatBytes(f.sizeBytes) }}</td>
        <td>{{ formatDate(f.createdAt) }}</td>
        <td>
          <button class="underline mr-2" @click="$emit('download', f.id)">Download / Скачать</button>
          <button v-if="canWrite" class="underline" @click="$emit('delete', f.id)">Delete / Удалить</button>
        </td>
      </tr>
    </Table>
    <p v-else>No files / Нет файлов</p>
  </div>
</template>

<script setup lang="ts">
import Table from './Table.vue'
import UploadDropzone from './UploadDropzone.vue'
import { useAuthStore } from '../stores/auth'
import { computed } from 'vue'
const props = defineProps<{ files: any[]; progress: number }>()
const emit = defineEmits(['upload', 'download', 'delete'])
const auth = useAuthStore()
const canWrite = computed(() => auth.can(['owner','operator']))
function formatDate(d?: string) {
  return d ? new Date(d).toLocaleString() : ''
}
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let i = -1
  do {
    bytes = bytes / 1024
    i++
  } while (bytes >= 1024 && i < units.length - 1)
  return bytes.toFixed(1) + ' ' + units[i]
}
</script>
