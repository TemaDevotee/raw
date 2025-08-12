<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminChatStore } from '../stores/chats';

const route = useRoute();
const chatId = String(route.params.id);
const store = useAdminChatStore();

const role = ref<'client' | 'agent'>('client');
const agentId = ref('');
const text = ref('');

onMounted(() => {
  store.load(chatId);
});

async function sendPublic() {
  await store.sendMessage(chatId, role.value, text.value, agentId.value || undefined);
  text.value = '';
}

async function createDraft() {
  if (!agentId.value) return;
  await store.createDraft(chatId, agentId.value, text.value);
  text.value = '';
}
</script>

<template>
  <div>
    <h1>Console / Консоль</h1>
    <div>
      <label>Role / Роль</label>
      <select v-model="role">
        <option value="client">Client / Клиент</option>
        <option value="agent">Agent / Агент</option>
      </select>
      <label>Agent ID / ID агента</label>
      <input v-model="agentId" />
    </div>
    <div>
      <label>Message / Сообщение</label>
      <textarea v-model="text" rows="3" />
      <div>{{ text.length }} chars</div>
      <button @click="sendPublic">Send public / Отправить публично</button>
      <button @click="createDraft">Create draft / Создать черновик</button>
    </div>
    <section>
      <h2>Transcript / Лента</h2>
      <ul>
        <li v-for="m in store.transcript" :key="m.id">
          <template v-if="m.draft">
            <span>[draft] {{ m.text }}</span>
            <button data-test="draft-approve" @click="store.approve(chatId, m.id)">Approve / Принять</button>
            <button data-test="draft-discard" @click="store.discard(chatId, m.id)">Discard / Отбросить</button>
          </template>
          <template v-else>
            <span>{{ m.role }}: {{ m.text }}</span>
          </template>
        </li>
      </ul>
    </section>
    <section>
      <h2>Presence / Присутствие</h2>
      <ul>
        <li v-for="p in store.presence" :key="p.id">{{ p.name }}</li>
      </ul>
    </section>
  </div>
</template>
