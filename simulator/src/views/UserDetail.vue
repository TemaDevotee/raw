<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminStore } from '../stores/admin';
import { t } from '../i18n';

const route = useRoute();
const store = useAdminStore();
const user = ref(null);
const tab = ref('workspaces');
const lists = ref({ workspaces: [], agents: [], knowledge: [], chats: [] });

async function load() {
  const id = route.params.id;
  user.value = await store.fetchUser(id);
  lists.value.workspaces = await store.fetchList(id, 'workspaces');
  lists.value.agents = await store.fetchList(id, 'agents');
  lists.value.knowledge = await store.fetchList(id, 'knowledge');
  lists.value.chats = await store.fetchList(id, 'chats');
}

onMounted(load);
</script>

<template>
  <div v-if="user">
    <h2>{{ user.name }}</h2>
    <div data-testid="sim-user-plan">{{ t('plan') }}: {{ user.plan }}</div>
    <div data-testid="sim-user-tokens">{{ t('tokens') }}: {{ user.tokens.used }} / {{ user.tokens.total }}</div>
    <div>
      <button data-testid="sim-tab-workspaces" @click="tab='workspaces'">{{ t('workspaces') }}</button>
      <button data-testid="sim-tab-agents" @click="tab='agents'">{{ t('agents') }}</button>
      <button data-testid="sim-tab-knowledge" @click="tab='knowledge'">{{ t('knowledge') }}</button>
      <button data-testid="sim-tab-chats" @click="tab='chats'">{{ t('chats') }}</button>
    </div>
    <ul v-show="tab==='workspaces'" data-testid="sim-list-workspaces">
      <li v-for="w in lists.workspaces" :key="w.id">{{ w.name }} — {{ w.updatedAt }}</li>
    </ul>
    <ul v-show="tab==='agents'" data-testid="sim-list-agents">
      <li v-for="a in lists.agents" :key="a.id">{{ a.name }} — {{ a.updatedAt }}</li>
    </ul>
    <ul v-show="tab==='knowledge'" data-testid="sim-list-knowledge">
      <li v-for="k in lists.knowledge" :key="k.id">{{ k.name }} ({{ k.sourceCount }}) — {{ k.updatedAt }}</li>
    </ul>
    <ul v-show="tab==='chats'" data-testid="sim-list-chats">
      <li v-for="c in lists.chats" :key="c.id">{{ c.title }} — {{ c.updatedAt }}</li>
    </ul>
  </div>
</template>
