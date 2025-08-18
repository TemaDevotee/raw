<template>
  <div v-if="tenants.length > 1" class="mb-4">
    <label class="block mb-1 text-sm">Tenant / Тенант</label>
    <select v-model="sel" @change="change" class="w-full bg-slate-900 text-white p-1">
      <option v-for="t in tenants" :key="t.id" :value="t.id">
        {{ t.name }} ({{ t.role }})
      </option>
    </select>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';
const auth = useAuthStore();
const tenants = computed(() => auth.tenants);
const sel = ref(auth.currentTenantId);
watch(() => auth.currentTenantId, (v) => (sel.value = v));
async function change() {
  if (sel.value && sel.value !== auth.currentTenantId) {
    await auth.switchTenant(sel.value);
    location.reload();
  }
}
</script>
