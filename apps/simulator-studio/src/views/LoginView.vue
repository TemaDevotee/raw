<template>
  <div class="max-w-sm mx-auto mt-20 space-y-4">
    <h2 class="text-xl font-semibold">Login / Вход</h2>
    <form @submit.prevent="submit" class="space-y-2">
      <input v-model="username" placeholder="Username / Логин" class="w-full p-2 rounded bg-slate-700" />
      <input type="password" v-model="password" placeholder="Password / Пароль" class="w-full p-2 rounded bg-slate-700" />
      <button type="submit" class="w-full py-2 bg-blue-600 text-white rounded">Login / Войти</button>
    </form>
    <p v-if="error" class="text-red-400">{{ error }}</p>
    <a v-if="allowSkip" href="/login.html?skipAuth=1" class="underline text-sm">Skip / Без входа</a>
    <div class="text-xs text-slate-400">
      Demo accounts / Демо-аккаунты:<br />
      alpha / Alpha123!<br />
      bravo / Bravo123!<br />
      charlie / Charlie123!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/adminClient';
import { useAuthStore } from '@/stores/auth';
import { showToast } from '@/stores/toast';

const username = ref('');
const password = ref('');
const error = ref('');
const allowSkip = import.meta.env.VITE_STUDIO_ALLOW_SKIP_AUTH === 'true';
const router = useRouter();
const auth = useAuthStore();

async function submit() {
  error.value = '';
  try {
    const { data } = await api.post('/auth/login', { username: username.value, password: password.value });
    auth.login(data.token, data.user, data.tenant);
    showToast('Logged in / Вход выполнен');
    router.push({ name: 'dashboard' });
  } catch {
    error.value = 'Invalid credentials / Неверные данные';
    showToast('Invalid credentials / Неверные данные', 'error');
  }
}
</script>
