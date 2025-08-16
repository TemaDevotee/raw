<template>
  <div class="flex h-full relative">
    <ChatList @created="focusClient" />
    <div class="flex-1 grid grid-rows-[1fr_auto]">
      <div class="p-3 overflow-auto" ref="scrollBox">
        <div v-if="!ch.currentId" class="opacity-70">Select a chat… / Выберите чат…</div>
        <div v-else class="space-y-2">
          <div v-for="m in ch.messages" :key="m.id" :class="m.role==='agent' ? 'text-blue-400' : 'text-neutral-200'">
            <b>{{ m.role }}:</b> {{ m.text }}
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 p-3 border-t">
        <Composer ref="clientComp" role="client" :busy="ch.posting" @send="ch.sendClient" />
        <Composer role="agent" :busy="ch.posting" @send="ch.sendAgent" />
      </div>
    </div>
    <SidePanel v-if="showDb" @close="showDb=false" />
    <div class="absolute top-2 right-2 flex items-center gap-2">
      <span class="w-2 h-2 rounded-full" :class="statusClass"></span>
      <button v-if="!showDb" @click="showDb=true">DB</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue';
import { useChatsStore } from '@studio/stores/chats';
import { useEventsStore } from '@studio/stores/events';
import ChatList from '@studio/components/ChatList.vue';
import Composer from '@studio/components/Composer.vue';
import SidePanel from '@studio/components/SidePanel.vue';
const ch = useChatsStore();
const events = useEventsStore();
const showDb = ref(window.innerWidth >= 1100);
function handleResize(){ showDb.value = window.innerWidth >= 1100; }
const scrollBox = ref<HTMLElement|null>(null);
const clientComp = ref<InstanceType<typeof Composer>|null>(null);
function focusClient(){ clientComp.value?.focus(); }
const statusClass = computed(() => {
  return events.status === 'open'
    ? 'bg-green-500'
    : events.status === 'connecting'
      ? 'bg-yellow-500'
      : events.status === 'polling'
        ? 'bg-red-500'
        : 'bg-gray-500';
});
watch(() => ch.messages.length, () => nextTick(() => {
  const el = scrollBox.value; if (el) el.scrollTop = el.scrollHeight;
}));
onMounted(() => { ch.fetchList(); events.connect('demo'); window.addEventListener('resize', handleResize); });
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); });
</script>
