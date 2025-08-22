<template>
  <div class="max-w-lg mx-auto mt-10 space-y-4">
    <h2 class="text-xl font-semibold">Preflight / Предпроверка</h2>
    <ul class="space-y-1">
      <li v-for="c in checks" :key="c.label" class="flex justify-between">
        <span>{{ c.label }}</span>
        <span v-if="c.status==='pending'">...</span>
        <span v-else-if="c.status==='ok'">✅</span>
        <span v-else class="text-red-400">❌ {{ c.error }}</span>
      </li>
    </ul>
    <button :disabled="!allOk" @click="go" class="py-2 px-4 bg-green-600 text-white rounded disabled:opacity-50">
      Continue to Studio / Продолжить
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/shared/http/api';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

interface Check { label: string; status: 'pending'|'ok'|'fail'; error: string; }
const checks = reactive<Check[]>([
  { label: 'Env / Переменные', status: 'pending', error: '' },
  { label: 'Backend reachable / Сервер доступен', status: 'pending', error: '' },
  { label: 'Token present / Токен есть', status: 'pending', error: '' },
  { label: '/api/auth/me', status: 'pending', error: '' },
  { label: 'Tenant context / Контекст тенанта', status: 'pending', error: '' },
  { label: 'Core feeds / Основные данные', status: 'pending', error: '' },
]);

const allOk = computed(() => checks.every(c => c.status === 'ok'));

function set(idx: number, ok: boolean, err = '') {
  checks[idx].status = ok ? 'ok' : 'fail';
  checks[idx].error = err;
}

onMounted(async () => {
  set(0, !!import.meta.env.VITE_API_BASE, 'missing');
  try {
    await api.get('/health');
    set(1, true);
  } catch {
    set(1, false, 'unreachable');
  }
  set(2, !!auth.token, 'no token');
  try {
    const { data } = await api.get('/auth/me');
    auth.user = data.user;
    auth.tenants = data.tenants;
    auth.currentTenantId = data.currentTenantId;
    set(3, true);
  } catch {
    set(3, false, 'fail');
    return;
  }
  set(4, auth.tenants.length > 0, 'none');
  try {
    const [agents, chats, files] = await Promise.all([
      api.get('/admin/agents'),
      api.get('/admin/chats'),
      api.get('/admin/knowledge/files'),
    ]);
    const ok = agents.data.items?.length && chats.data.items?.length && files.data.items?.length;
    set(5, !!ok, ok ? '' : 'empty');
  } catch {
    set(5, false, 'fail');
  }
});

function go() {
  const redirect = (route.query.redirect as string) || '/';
  router.push(redirect);
}
</script>
