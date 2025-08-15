<template>
  <div
    class="border border-dashed p-4 text-center"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <p>Drag files here / Перетащите файлы сюда</p>
    <input ref="inp" type="file" class="hidden" @change="onFile" />
    <button class="underline mt-2" @click="trigger">Choose File / Выбрать файл</button>
    <div v-if="progress > 0" class="mt-2">{{ progress }}%</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ progress: number }>()
const emit = defineEmits(['upload'])
const inp = ref<HTMLInputElement | null>(null)
function trigger() {
  inp.value?.click()
}
function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('upload', file)
}
function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) emit('upload', file)
}
</script>
