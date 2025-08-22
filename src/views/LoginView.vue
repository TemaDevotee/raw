<template>
  <div class="max-w-sm mx-auto mt-20 space-y-4">
    <h2 class="text-xl font-semibold">Select tenant / Выберите тенанта</h2>
    <select v-model="selectedTenant" class="w-full p-2 rounded bg-slate-700">
      <option disabled value="">Select… / Выберите…</option>
      <option v-for="t in tenants" :key="t.id" :value="t">{{ t.name }}</option>
    </select>
    <button
      class="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      :disabled="!selectedTenant"
      @click="login"
    >
      Login / Войти
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const tenants = ref<Array<any>>([]);
const selectedTenant = ref<any | null>(null);
const router = useRouter();
const auth = useAuthStore();

onMounted(async () => {
  const res = await fetch('/tenants');
  tenants.value = await res.json();
});

function login() {
  if (!selectedTenant.value) return;
  auth.setSession('mock-token', { id: 'mock', name: 'Mock User' }, [selectedTenant.value], selectedTenant.value.id);
  router.push({ name: 'dashboard' });
}
</script>
