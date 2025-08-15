<template>
  <div>
    <h1 class="text-xl mb-4">Tenants / Арендаторы</h1>
    <input
      v-model="store.search"
      @input="store.fetchTenants()"
      placeholder="Search / Поиск"
      class="border p-1 mb-2"
    />
    <Table>
      <template #head>
        <th class="text-left">Name / Имя</th>
        <th class="text-left">Plan / План</th>
      </template>
      <tr
        v-for="t in store.items"
        :key="t.id"
        @click="go(t.id)"
        class="cursor-pointer hover:bg-gray-50"
      >
        <td>{{ t.name }}</td>
        <td>{{ t.plan }}</td>
      </tr>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTenantsStore } from '../stores/tenants'
import Table from '../components/Table.vue'

const store = useTenantsStore()
const router = useRouter()

onMounted(() => store.fetchTenants())

function go(id: string) {
  router.push(`/tenants/${id}`)
}
</script>
