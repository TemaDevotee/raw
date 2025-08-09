<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div class="bg-white dark:bg-gray-800 p-4 rounded-md w-72">
      <h2 class="text-lg mb-4">{{ t('tokens.purchase') }}</h2>
      <div class="flex gap-2 mb-4">
        <button v-for="n in [10000,50000,100000]" :key="n" class="px-2 py-1 border rounded" @click="tokens=n">
          +{{ n/1000 }}k
        </button>
      </div>
      <input type="number" v-model.number="tokens" class="w-full border p-1 mb-4" />
      <div class="flex justify-end gap-2">
        <button class="px-3 py-1" @click="$emit('close')">Cancel</button>
        <button class="px-3 py-1 bg-indigo-600 text-white rounded" @click="confirm">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import billingStore from '@/stores/billingStore'
import { showToast } from '@/stores/toastStore'
import langStore from '@/stores/langStore'

const tokens = ref(10000)
function t(key, params){ return langStore.t(key, params) }
async function confirm(){
  await billingStore.purchase(tokens.value)
  showToast(t('tokens.purchased', { count: tokens.value }), 'success')
  tokens.value = 10000
  emit('close')
}
const emit = defineEmits(['close'])
</script>
