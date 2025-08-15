<template>
  <div class="mb-2 text-right">
    <div class="text-xs text-gray-500">
      draft · черновик · {{ new Date(ts).toLocaleString() }}
    </div>
    <div class="inline-block px-2 py-1 rounded bg-gray-200">
      <div>{{ text }}</div>
      <div v-if="canModerate" class="text-xs mt-1">
        <button class="mr-2 underline" @click="$emit('approve', id)">
          Approve / Подтвердить
        </button>
        <button class="underline" @click="$emit('discard', id)">
          Discard / Отменить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
defineProps<{ id: string; text: string; ts: number }>()
defineEmits(['approve', 'discard'])
const auth = useAuthStore()
const canModerate = computed(() => auth.can(['owner','operator']))
</script>
