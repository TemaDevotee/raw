<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Account / Аккаунт</h2>
    <p v-if="auth.user">Signed in as {{ auth.user.username }} (tenant {{ auth.user.tenantId }}, role {{ auth.user.role }})</p>
    <p v-if="auth.tenant">Plan: {{ auth.tenant.plan }} – tokens {{ auth.tenant.usage.tokensUsed }}/{{ auth.tenant.quotas.tokensLimit }}, storage {{ auth.tenant.usage.storageMb }}/{{ auth.tenant.quotas.storageMb }} MB</p>
    <div class="space-x-2">
      <button v-for="u in users" :key="u" class="px-2 py-1 bg-slate-700 rounded" @click="switchTo(u)">
        Switch to {{ u }} / Сменить на {{ u }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '@/adminClient';
import { useAuthStore } from '@/stores/auth';
import { showToast } from '@/stores/toast';

const auth = useAuthStore();
const users = ['alpha', 'bravo', 'charlie'];

async function switchTo(username: string) {
  try {
    const { data } = await api.post('/admin/dev/impersonate', { username });
    auth.login(data.token, data.user, data.tenant);
    showToast('Switched / Сменили аккаунт');
  } catch {
    showToast('Switch failed / Смена не удалась', 'error');
  }
}
</script>
