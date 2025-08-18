<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Account / Аккаунт</h2>
    <p v-if="auth.user">Signed in as {{ auth.user.email }} (tenant {{ auth.currentTenantId }}, role {{ auth.currentRole }})</p>
    
    <div class="space-x-2">
      <button v-for="u in users" :key="u" class="px-2 py-1 bg-slate-700 rounded" @click="switchTo(u)">
        Switch to {{ u }} / Сменить на {{ u }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '@/shared/http/api';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/toast';

const auth = useAuthStore();
const users = ['alpha@raw.dev', 'beta@raw.dev', 'gamma@raw.dev'];

async function switchTo(email: string) {
  try {
    const { data } = await api.post('/admin/dev/impersonate', { email });
    auth.token = data.token;
    auth.user = data.user;
    auth.persistToken(data.token);
    showToast('Switched / Сменили аккаунт');
  } catch {
    showToast('Switch failed / Смена не удалась', 'error');
  }
}
</script>
