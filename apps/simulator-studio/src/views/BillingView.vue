<template>
  <div class="p-4 space-y-4">
    <h2 class="text-xl font-semibold">Billing / Биллинг</h2>
    <div class="flex flex-col gap-2">
      <div>
        {{ store.plan.name }}
        <select v-model="selectedPlan" @change="change" class="ml-2 border px-2 py-1">
          <option value="free">Free / Бесплатный</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <TokenBar :balance="store.tokenBalance" :included="store.plan.includedMonthlyTokens" />
        <span>{{ store.tokenBalance }} / {{ store.plan.includedMonthlyTokens }} tokens</span>
      </div>
      <div>Next reset / Следующее обновление: {{ nextReset }}</div>
    </div>
    <div>
      <h3 class="font-semibold">Adjust tokens / Изменить токены</h3>
      <input type="number" v-model.number="delta" class="border px-2 py-1 mr-2" />
      <button @click="adjust" class="bg-blue-500 text-white px-2 py-1">Apply / Применить</button>
    </div>
    <div>
      <h3 class="font-semibold">Usage by agent / Расход по агентам</h3>
      <table class="mt-2 w-full text-sm">
        <tr v-for="row in store.usageSummary?.byAgent || []" :key="row.agentId">
          <td class="border px-2 py-1">{{ row.agentId }}</td>
          <td class="border px-2 py-1">{{ row.tokens }}</td>
        </tr>
      </table>
    </div>
    <div>
      <h3 class="font-semibold">Logs / Логи</h3>
      <table class="mt-2 w-full text-xs">
        <tr v-for="l in store.logs.items" :key="l.id">
          <td class="border px-1 py-0.5">{{ new Date(l.ts).toLocaleString() }}</td>
          <td class="border px-1 py-0.5">{{ l.role }}</td>
          <td class="border px-1 py-0.5">{{ l.tokens }}</td>
          <td class="border px-1 py-0.5">{{ l.note }}</td>
        </tr>
      </table>
      <button v-if="store.logs.nextCursor" @click="more" class="mt-2 underline">Load more / Ещё</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useBillingStore } from '@/stores/billingStore';
import TokenBar from '@/components/ui/TokenBar.vue';

const store = useBillingStore();
const selectedPlan = ref('free');
const delta = ref(0);

const nextReset = computed(() => {
  const ts = store.cycleResetAt + 30 * 24 * 60 * 60 * 1000;
  return new Date(ts).toLocaleDateString();
});

function change() {
  store.changePlan(selectedPlan.value as any);
}
function adjust() {
  store.adjustTokens(delta.value);
  delta.value = 0;
}
function more() {
  if (store.logs.nextCursor)
    store.fetchLogs({ cursor: store.logs.nextCursor });
}

onMounted(async () => {
  await store.fetchPlan();
  selectedPlan.value = store.plan.id;
  const now = Date.now();
  await store.fetchUsageSummary({ since: now - 7 * 24 * 60 * 60 * 1000, until: now });
  await store.fetchLogs();
});
</script>
