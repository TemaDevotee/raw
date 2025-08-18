<template>
  <div class="max-w-sm mx-auto mt-20 space-y-4">
    <h2 class="text-xl font-semibold">Login / Вход</h2>
    <form @submit.prevent="submit" class="space-y-2">
      <input v-model="email" placeholder="Email / Эл. почта" class="w-full p-2 rounded bg-slate-700" />
      <input type="password" v-model="password" placeholder="Password / Пароль" class="w-full p-2 rounded bg-slate-700" />
      <button type="submit" class="w-full py-2 bg-blue-600 text-white rounded">Login / Войти</button>
    </form>
    <p v-if="error" class="text-red-400">{{ error }}</p>
    <router-link to="/login?skipAuth=1" class="underline text-sm">Skip / Без входа</router-link>
    <div class="text-xs text-slate-400">
      Demo accounts / Демо-аккаунты:<br />
      alpha@raw.dev / RawDev!2025<br />
      alpha.op@raw.dev / RawDev!2025<br />
      beta@raw.dev / RawDev!2025
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();
const auth = useAuthStore();

async function submit() {
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push({ name: 'dashboard' });
  } catch {
    error.value = 'Invalid credentials / Неверные данные';
  }
}
</script>
