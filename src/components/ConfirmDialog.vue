<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-black/50"
    role="dialog"
    aria-modal="true"
    @keydown.esc="emit('cancel')"
  >
    <div
      class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow w-80 max-w-full"
      tabindex="0"
      ref="box"
    >
      <h2 class="text-lg font-semibold mb-2">{{ title }}</h2>
      <p class="mb-4 whitespace-pre-line">{{ body }}</p>
      <div class="flex justify-end gap-2">
        <button class="btn-secondary min-h-[44px]" @click="emit('cancel')">
          {{ cancelLabel }}
        </button>
        <button class="btn-primary min-h-[44px]" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

defineProps({
  title: String,
  body: String,
  confirmLabel: String,
  cancelLabel: String,
})

const emit = defineEmits(['confirm', 'cancel'])
const box = ref(null)

onMounted(() => {
  box.value?.focus()
})
</script>
