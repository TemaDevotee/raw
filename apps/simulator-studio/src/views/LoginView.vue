<template>
  <div class="max-w-sm mx-auto mt-20 space-y-4">
    <h2 class="text-xl font-semibold">Login / Вход</h2>
    <form @submit.prevent="submit" class="space-y-2">
      <input v-model="email" placeholder="Email / Электронная почта" class="w-full p-2 rounded bg-slate-700" />
      <input type="password" v-model="password" placeholder="Password / Пароль" class="w-full p-2 rounded bg-slate-700" />
      <button type="submit" class="w-full py-2 bg-blue-600 text-white rounded">Login / Войти</button>
    </form>
    <p v-if="error" class="text-red-400">{{ error }}</p>
    <div class="text-xs text-slate-400">
      Demo accounts / Демо-аккаунты:<br />
      alpha@raw.dev / RawDev!2025<br />
      beta@raw.dev / RawDev!2025<br />
      gamma@raw.dev / RawDev!2025
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/toast';

const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

async function submit() {
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    showToast('Logged in / Вход выполнен');
    const redirect = (route.query.redirect as string) || '/';
    router.push({ name: 'preflight', query: { redirect } });
  } catch {
    error.value = 'Invalid credentials / Неверные данные';
    showToast('Invalid credentials / Неверные данные', 'error');
  }
}
</script>
