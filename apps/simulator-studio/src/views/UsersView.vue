<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Users / Пользователи</h2>
    <table class="w-full text-left" v-if="users.length">
      <thead>
        <tr><th>Name / Имя</th><th>Email</th><th>Role / Роль</th></tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.role }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No users / Нет пользователей</p>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import api from '@/shared/http/api';
import { useAuthStore } from '@/stores/authStore';
const auth = useAuthStore();
const users = ref<Array<any>>([]);
async function load() {
  const { data } = await api.get('/admin/users', { params: { tenant: auth.currentTenantId } });
  users.value = data.items;
}
onMounted(load);
</script>
