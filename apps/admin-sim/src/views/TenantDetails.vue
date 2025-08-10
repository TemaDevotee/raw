<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantsStore } from '../stores/tenants';
import TokenBar from '../components/TokenBar.vue';

const store = useTenantsStore();
const route = useRoute();
const tenant = ref<any>(null);

onMounted(async () => {
  tenant.value = await store.fetchDetails(route.params.id as string);
});
</script>

<template>
  <div v-if="tenant">
    <h1>{{ tenant.name }}</h1>
    <p>Plan: {{ tenant.billing.plan }}</p>
    <p>Period: {{ tenant.billing.period.start }} – {{ tenant.billing.period.end }}</p>
    <TokenBar :used="tenant.billing.tokenUsed" :quota="tenant.billing.tokenQuota" />
    <p>Used {{ tenant.billing.tokenUsed.toLocaleString() }} of {{ tenant.billing.tokenQuota.toLocaleString() }}</p>
    <p>Workspaces: {{ tenant.workspacesCount }} | Agents: {{ tenant.agentsCount }} | Knowledge: {{ tenant.knowledgeCount }} | Chats: {{ tenant.chatsCount }}</p>
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
