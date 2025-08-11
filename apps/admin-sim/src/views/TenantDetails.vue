<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantsStore } from '../stores/tenants';
import TokenBar from '../components/TokenBar.vue';
import {
  postPlan,
  postQuota,
  postCredit,
  postDebit,
  postReset,
  getLedger
} from '../api/client';

const store = useTenantsStore();
const route = useRoute();
const tenant = ref(null);
const ledger = ref([]);
const id = route.params.id;

async function refresh() {
  tenant.value = await store.fetchDetails(id);
  const log = await getLedger(id);
  ledger.value = log.items;
}

onMounted(refresh);

async function changePlan() {
  const plan = prompt('Plan (Free|Pro|Team)', tenant.value.billing.plan);
  if (!plan) return;
  await postPlan(id, plan);
  await refresh();
}

async function changeQuota() {
  const val = prompt('Set quota', String(tenant.value.billing.tokenQuota));
  if (!val) return;
  await postQuota(id, parseInt(val, 10));
  await refresh();
}

async function credit() {
  const val = prompt('Credit tokens');
  if (!val) return;
  await postCredit(id, parseInt(val, 10));
  await refresh();
}

async function debit() {
  const val = prompt('Debit tokens');
  if (!val) return;
  await postDebit(id, parseInt(val, 10));
  await refresh();
}

async function resetPeriod() {
  await postReset(id);
  await refresh();
}
</script>

<template>
  <div v-if="tenant">
    <h1>{{ tenant.name }}</h1>
    <p>Plan: {{ tenant.billing.plan }}</p>
    <p>Period: {{ tenant.billing.period.start }} – {{ tenant.billing.period.end }}</p>
    <TokenBar :used="tenant.billing.tokenUsed" :quota="tenant.billing.tokenQuota" />
    <p>Used {{ tenant.billing.tokenUsed.toLocaleString() }} of {{ tenant.billing.tokenQuota.toLocaleString() }}</p>
    <div class="actions">
      <button data-testid="act-plan" @click="changePlan">Change plan</button>
      <button data-testid="act-quota" @click="changeQuota">Change quota</button>
      <button data-testid="act-credit" @click="credit">Credit</button>
      <button data-testid="act-debit" @click="debit">Debit</button>
      <button data-testid="act-reset" @click="resetPeriod">Reset period</button>
    </div>
    <p>Workspaces: {{ tenant.workspacesCount }} | Agents: {{ tenant.agentsCount }} | Knowledge: {{ tenant.knowledgeCount }} | Chats: {{ tenant.chatsCount }}</p>
    <section>
      <h2>Ledger</h2>
      <table data-testid="ledger-table">
        <thead><tr><th>ts</th><th>type</th><th>amount</th><th>by</th></tr></thead>
        <tbody>
          <tr v-for="l in ledger" :key="l.id">
            <td>{{ l.ts }}</td><td>{{ l.type }}</td><td>{{ l.amount ?? '' }}</td><td>{{ l.by }}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section>
      <h2>Workspaces</h2>
      <p>Coming soon</p>
      <h2>Agents</h2>
      <p>Coming soon</p>
      <h2>Knowledge</h2>
      <p>Coming soon</p>
      <h2>Chats</h2>
      <p>Coming soon</p>
    </section>
  </div>
  <div v-else>Loading…</div>
</template>
