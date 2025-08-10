<script setup>
import { onMounted } from 'vue';
import { useAdminStore } from '../stores/admin';
import { t } from '../i18n';

const store = useAdminStore();
onMounted(() => {
  store.fetchUsers();
});
</script>

<template>
  <table data-testid="sim-users-table" border="1">
    <thead>
      <tr>
        <th>{{ t('name') }}</th>
        <th>{{ t('email') }}</th>
        <th>{{ t('plan') }}</th>
        <th>{{ t('tokens') }}</th>
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
        <td>{{ u.plan }}</td>
        <td>{{ u.tokens.used }} / {{ u.tokens.total }}</td>
      </tr>
    </tbody>
  </table>
</template>
