<template>
  <form @submit.prevent="send" class="mt-2">
    <input
      v-model="text"
      :placeholder="placeholder"
      class="border p-1 w-full mb-1"
    />
    <button type="submit" class="px-2 py-1 bg-black text-white">
      {{ label }} / {{ labelRu }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ placeholder?: string; label?: string; labelRu?: string }>()
const emit = defineEmits(['send'])
const text = ref('')

const label = props.label || 'Send'
const labelRu = props.labelRu || 'Отправить'

function send() {
  if (!text.value.trim()) return
  emit('send', text.value)
  text.value = ''
}
</script>
