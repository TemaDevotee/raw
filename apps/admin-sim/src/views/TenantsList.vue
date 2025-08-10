<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useTenantsStore } from '../stores/tenants';
import TokenBar from '../components/TokenBar.vue';

const store = useTenantsStore();
const q = ref('');
let timer: any;

watch(q, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    store.fetchList({ q: q.value, page: 1 });
  }, 300);
});

onMounted(() => {
  store.fetchList();
});
</script>

<template>
  <div>
    <input v-model="q" placeholder="Search" />
    <table border="1">
      <thead>
        <tr>
          <th>Name</th>
          <th>Plan</th>
          <th>Usage</th>
          <th>Quota</th>
          <th>Used</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in store.items" :key="t.id" @click="$router.push(`/tenants/${t.id}`)" style="cursor:pointer">
          <td>{{ t.name }}</td>
          <td>{{ t.billing.plan }}</td>
          <td><TokenBar :used="t.billing.tokenUsed" :quota="t.billing.tokenQuota" /></td>
          <td>{{ t.billing.tokenQuota.toLocaleString() }}</td>
          <td>{{ t.billing.tokenUsed.toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
    <div>
      <button @click="store.fetchList({ q: q, page: store.page - 1 })" :disabled="store.page <= 1">Prev</button>
      <span>{{ store.page }}</span>
      <button
        @click="store.fetchList({ q: q, page: store.page + 1 })"
        :disabled="store.page * store.limit >= store.total"
      >Next</button>
    </div>
  </div>
</template>
