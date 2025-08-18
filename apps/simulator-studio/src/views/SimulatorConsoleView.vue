<template>
  <div v-if="!sim.enabled" class="p-4">Simulator disabled / Симулятор отключен</div>
  <div v-else class="flex gap-4 p-4">
    <div class="flex-1 space-y-4">
      <div>
        <h2 class="font-bold mb-2">Quick actions / Быстрые действия</h2>
        <div class="flex flex-wrap gap-2">
          <button class="btn" @click="join">Presence join / Присоединиться</button>
          <button class="btn" @click="leave">Presence leave / Покинуть</button>
          <button class="btn" @click="draftBurst">Draft burst ×3 / Три черновика</button>
          <button class="btn" @click="setStatus('live')">Set status live / Статус live</button>
        </div>
      </div>
      <div>
        <h2 class="font-bold mb-2">Emit event / Отправить событие</h2>
        <form @submit.prevent="submit" class="space-y-2">
          <select v-model="etype" class="input">
            <option value="chat.message">chat.message</option>
            <option value="chat.message.draft">chat.message.draft</option>
            <option value="presence.join">presence.join</option>
            <option value="presence.leave">presence.leave</option>
            <option value="chat.status.update">chat.status.update</option>
          </select>
          <textarea v-model="payload" class="input h-32" placeholder="{\"chatId\":\"...\"}"></textarea>
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="noCharge" />
            <span>Do not charge tokens / Не списывать токены</span>
          </label>
          <button type="submit" class="btn">Send / Отправить</button>
        </form>
      </div>
    </div>
    <div class="w-64">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-2 h-2 rounded-full" :class="sim.wsConnected ? 'bg-green-500' : 'bg-red-500'"></span>
        <span>Feed / Поток</span>
        <button class="ml-auto text-xs underline" @click="sim.paused = !sim.paused">
          {{ sim.paused ? 'Resume / Возобновить' : 'Pause / Пауза' }}
        </button>
      </div>
      <div class="h-96 overflow-auto text-xs bg-neutral-800 p-2 rounded">
        <div v-for="e in sim.feed" :key="e.ts" class="mb-1">
          <div class="font-mono">{{ e.type }} — {{ new Date(e.ts || Date.now()).toLocaleTimeString() }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useSimulatorStore } from '@/stores/simulatorStore';

const sim = useSimulatorStore();
const etype = ref('chat.message');
const payload = ref('');
const noCharge = ref(false);

function submit() {
  try {
    const data = payload.value ? JSON.parse(payload.value) : {};
    sim.emitEvent({ type: etype.value, payload: data, options: { simulateNoCharge: noCharge.value } });
  } catch {
    // ignore
  }
}
function join() {
  sim.emitEvent({ type: 'presence.join', payload: { chatId: dataChat(), role: 'operator' } });
}
function leave() {
  sim.emitEvent({ type: 'presence.leave', payload: { chatId: dataChat(), role: 'operator' } });
}
function draftBurst() {
  const id = dataChat();
  for (let i = 0; i < 3; i++) {
    sim.emitEvent({ type: 'chat.message.draft', payload: { chatId: id, agentId: 'a1', content: `draft ${i + 1}` } });
  }
}
function setStatus(s: string) {
  sim.emitEvent({ type: 'chat.status.update', payload: { chatId: dataChat(), status: s } });
}
function dataChat() {
  try {
    const obj = payload.value ? JSON.parse(payload.value) : {};
    return obj.chatId || '';
  } catch {
    return '';
  }
}
</script>
<style scoped>
.btn {
  @apply px-2 py-1 bg-neutral-700 rounded text-xs;
}
.input {
  @apply w-full px-2 py-1 bg-neutral-700 rounded text-xs;
}
</style>
