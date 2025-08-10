<script setup>
import { ref, watch, onMounted } from 'vue';
import { useAdminStore } from '../stores/admin';
import { t } from '../i18n';

const store = useAdminStore();
const q = ref('');
const plan = ref('');
const sort = ref('name');
const page = ref(1);

async function load() {
  await store.fetchUsers({ q: q.value, plan: plan.value, sort: sort.value, page: page.value });
}

onMounted(async () => {
  await store.loadPlans();
  await load();
});

watch([q, plan, sort, page], load);
</script>

<template>
  <div>
    <div>
      <input data-testid="sim-filter-q" v-model="q" :placeholder="t('search')" />
      <select data-testid="sim-filter-plan" v-model="plan">
        <option value="">{{ t('plan') }}</option>
        <option v-for="p in store.plans" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <select data-testid="sim-sort-select" v-model="sort">
        <option value="name">{{ t('name') }}</option>
        <option value="plan">{{ t('plan') }}</option>
        <option value="tokensUsed">{{ t('usage') }}</option>
      </select>
    </div>
    <table data-testid="sim-users-table" border="1">
      <thead>
        <tr>
          <th>{{ t('name') }}</th>
          <th>{{ t('email') }}</th>
          <th>{{ t('plan') }}</th>
          <th>{{ t('tokens') }}</th>
          <th>{{ t('usage') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="u in store.users"
          :key="u.id"
          :data-testid="`sim-user-row-${u.id}`"
        >
          <td><router-link :to="`/users/${u.id}`">{{ u.name }}</router-link></td>
          <td>{{ u.email }}</td>
          <td>{{ u.planName }}</td>
          <td>{{ u.tokens.used }} / {{ u.tokens.total }}</td>
          <td>{{ (u.tokenUsagePct * 100).toFixed(1) }}%</td>
        </tr>
      </tbody>
    </table>
    <div data-testid="sim-pager">
      <button @click="page--" :disabled="page <= 1">Prev</button>
      <span>{{ page }} / {{ store.totalPages }}</span>
      <button @click="page++" :disabled="page >= store.totalPages">Next</button>
    </div>
  </div>
</template>
