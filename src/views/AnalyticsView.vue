<template>
  <div class="p-4">
    <h1 class="text-xl mb-4">{{ t('tokens.analytics') }}</h1>
    <table class="w-full text-sm" v-if="rows.length">
      <thead>
        <tr>
          <th class="text-left">{{ t('tokens.byChat') }}</th>
          <th>{{ t('tokens.total') }}</th>
          <th>{{ t('tokens.avgPerMsg') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.key">
          <td>{{ r.key }}</td>
          <td>{{ r.totalTokens }}</td>
          <td>{{ (r.totalTokens / r.messages).toFixed(1) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import usageStore from '@/stores/usageStore'
import langStore from '@/stores/langStore'

const rows = ref([])
function t(key, params){ return langStore.t(key, params) }

onMounted(async () => {
  rows.value = await usageStore.aggregate({ groupBy: 'chat' })
})
</script>
