<template>
  <div class="max-w-xs mx-auto mt-40">
    <h1 class="text-lg mb-4">Login / Вход</h1>
    <form @submit.prevent="submit">
      <label class="block mb-2">Email / Email</label>
      <input v-model="email" class="border w-full mb-4" />
      <label class="block mb-2">Password / Пароль</label>
      <input type="password" v-model="password" class="border w-full mb-4" />
      <button class="underline">Login / Войти</button>
    </form>
    <p v-if="error" class="text-red-500 mt-2 text-sm">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function submit() {
  try {
    await auth.login(email.value, password.value)
    router.push('/tenants')
  } catch (e: any) {
    error.value = e.message
  }
}
</script>
