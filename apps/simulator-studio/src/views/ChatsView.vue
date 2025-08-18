<template>
  <div>
    <h2 class="text-xl font-semibold mb-3">Chats / Чаты</h2>
    <div class="mb-4 flex items-center gap-2">
      <input
        v-model="q"
        @input="applyFilters"
        class="border px-2 py-1"
        placeholder="Search title, client, agent / Поиск названия, клиента, агента"
      />
      <label v-for="s in allStatuses" :key="s" class="flex items-center gap-1">
        <input type="checkbox" :value="s" v-model="statuses" @change="applyFilters" />
        {{ s }}
      </label>
    </div>
    <ul>
      <li
        v-for="c in store.list"
        :key="c.id"
        class="border-b py-2 cursor-pointer flex items-center gap-2 relative"
        @click="go(c.id)"
      >
        <span class="h-2 w-2 rounded-full" :style="{ background: statusColor(c.status) }"></span>
        <span class="font-medium">{{ c.title }}</span>
        <span class="ml-auto text-sm opacity-70">{{ c.participants.clientName }}</span>
        <AgentAvatarTiny
          v-if="agentById(c.participants.agentId)"
          class="absolute top-0 right-0 mt-1 mr-1"
          :src="agentById(c.participants.agentId)?.avatarUrl"
          :name="agentById(c.participants.agentId)?.name"
          :size="16"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatsStore } from '@/stores/chats';
import { useAgentsStore } from '@/stores/agents';
import AgentAvatarTiny from '@/components/AgentAvatarTiny.vue';

const store = useChatsStore();
const agents = useAgentsStore();
const router = useRouter();
const q = ref('');
const statuses = ref<string[]>([]);
const allStatuses = ['attention', 'live', 'paused', 'resolved', 'ended'];

function statusColor(s: string) {
  return (
    {
      attention: 'var(--status-color-attention)',
      live: 'var(--status-color-live)',
      paused: 'var(--status-color-paused)',
      resolved: 'var(--status-color-resolved)',
      ended: 'var(--status-color-idle)',
    }[s] || 'var(--status-color-idle)'
  );
}

function agentById(id: string | null) {
  return id ? agents.getById(id) : undefined;
}

function applyFilters() {
  store.fetchChats({ status: statuses.value, q: q.value });
}

function go(id: string) {
  router.push({ name: 'chat', params: { id } });
}

onMounted(() => {
  agents.fetchAll();
  applyFilters();
});
</script>

