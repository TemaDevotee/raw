<template>
  <div class="p-10 space-y-6">
    <header class="flex items-center mb-8 space-x-4">
      <router-link to="/agents" class="btn-secondary">
        <span class="material-icons-outlined mr-1">arrow_back</span>
        {{ langStore.t('backToAll') }}
      </router-link>
      <h1 class="text-3xl font-bold">{{ agent.name }}</h1>
    </header>

    <!-- Tabs -->
    <div class="flex space-x-4 border-b border-default mb-4">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="pb-2 px-3 font-medium border-b-2"
        :class="
          activeTab === tab
            ? 'border-[var(--c-text-brand)] text-[var(--c-text-brand)]'
            : 'border-transparent text-[var(--c-text-secondary)]'
        "
      >
        {{ langStore.t(tab) }}
      </button>
    </div>

    <!-- Tab contents -->
    <template v-if="activeTab === 'info'">
      <!-- When editing, embed the AgentForm inline.  Otherwise show info details. -->
      <div v-if="editing" class="bg-secondary p-6 rounded-xl border border-default">
        <AgentForm
          :agentId="agentId"
          :onSaveSuccess="() => { fetchAgent(); editing = false; }"
          @close="editing = false"
        />
      </div>
      <div v-else class="bg-secondary p-6 rounded-xl border border-default space-y-4">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xl font-semibold">{{ langStore.t('agentInfoTitle') || 'Agent Info' }}</h3>
          <button @click="editAgent" class="btn-secondary flex items-center space-x-1">
            <span class="material-icons-outlined text-base">edit</span>
            <span>{{ langStore.t('edit') }}</span>
          </button>
        </div>
        <dl class="divide-y divide-default">
          <div class="flex justify-between py-3">
            <dt class="font-medium text-default">{{ langStore.t('agentName') }}</dt>
            <dd class="text-muted">{{ agent.name }}</dd>
          </div>
          <div class="flex justify-between py-3">
            <dt class="font-medium text-default">{{ langStore.t('modelLabel') }}</dt>
            <dd class="text-muted">{{ agent.model }}</dd>
          </div>
          <div class="flex justify-between py-3">
            <dt class="font-medium text-default">{{ langStore.t('personality') }}</dt>
            <dd class="text-muted">{{ agent.personality }}</dd>
          </div>
          <div class="flex justify-between py-3">
            <dt class="font-medium text-default">{{ langStore.t('channels') }}</dt>
            <dd class="text-muted">
              <span v-if="!agent.channels || agent.channels.length === 0">-</span>
              <span v-else v-for="ch in agent.channels" :key="ch" class="inline-flex items-center mr-2">
                <span class="material-icons-outlined text-base">{{ getChannelIcon(ch) }}</span>
              </span>
            </dd>
          </div>
          <div class="flex justify-between py-3">
            <dt class="font-medium text-default">{{ langStore.t('knowledgeBases') }}</dt>
            <dd class="text-muted">{{ getKnowledgeNames(agent) }}</dd>
          </div>
          <div class="flex justify-between py-3">
            <dt class="font-medium text-default">{{ langStore.t('statusColumn') }}</dt>
            <dd class="text-muted">
              {{ agent.isPublished ? langStore.t('statusPublished') : langStore.t('statusDraft') }}
            </dd>
          </div>

          <!-- Approval mode toggle: allow enabling/disabling draft approval at the agent level -->
          <div class="flex justify-between items-center py-3">
            <dt class="font-medium text-default">{{ langStore.t('requiresApproval') }}</dt>
            <dd class="text-muted flex items-center gap-2">
              <input
                id="approve-mode-toggle"
                type="checkbox"
                class="form-checkbox h-4 w-4"
                :checked="agent.approveRequired"
                @change="toggleApproveMode($event)"
              />
            </dd>
          </div>
        </dl>
      </div>
    </template>
    <template v-else-if="activeTab === 'testSandbox'">
      <div class="flex flex-col h-[500px] border border-default rounded-lg overflow-hidden">
        <div class="flex-1 p-6 overflow-y-auto space-y-4 bg-secondary">
          <div
            v-for="(msg, index) in testMessages"
            :key="index"
            class="flex"
            :class="msg.sender === 'admin' ? 'justify-end' : 'justify-start'"
          >
            <div
              :class="messageBubbleClasses(msg.sender)"
              class="max-w-sm px-4 py-2 rounded-lg shadow"
            >
              {{ msg.text }}
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-default bg-secondary flex items-center">
          <input
            v-model="sandboxInput"
            type="text"
            :placeholder="langStore.t('typeMessage')"
            class="flex-1 form-input mr-3"
            @keyup.enter="sendSandboxMessage"
          />
          <button
            class="btn-primary"
            :disabled="!sandboxInput"
            @click="sendSandboxMessage"
          >
            {{ langStore.t('send') }}
          </button>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="text-[var(--c-text-secondary)]">
        <p>{{ langStore.t('comingSoon') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/api';
import { showToast } from '@/stores/toastStore';
import langStore from '@/stores/langStore';
import { agentStore } from '@/stores/agentStore.js';
import AgentForm from '@/components/AgentForm.vue';

const route = useRoute();
const agentId = route.params.id;
const agent = ref({ name: '' });
// When true, the in‑place edit form is shown instead of the info details
const editing = ref(false);
// Knowledge groups are fetched to map agent.knowledgeIds to names.
const knowledgeGroups = ref([]);

// Tab identifiers.  The first tab displays agent information.  The labels are
// translated via langStore in the template.  Default tab shows the info.
const tabs = ['info', 'testSandbox', 'analytics', 'integrations'];
const activeTab = ref('info');

const testMessages = ref([]);
const sandboxInput = ref('');

async function fetchAgent() {
  try {
    const res = await apiClient.get(`/agents/${agentId}`);
    agent.value = res.data;
    agentStore.setManualApprove(!!res.data.approveRequired);
  } catch (e) {
    console.error(e);
  }
}
onMounted(fetchAgent);

// Fetch all knowledge groups to look up names when displaying agent details
async function fetchKnowledgeGroups() {
  try {
    const res = await apiClient.get('/knowledge_groups');
    knowledgeGroups.value = res.data;
  } catch (e) {
    console.error(e);
  }
}
onMounted(fetchKnowledgeGroups);

// Utility: return channel icon name based on channel key
function getChannelIcon(channel) {
  switch (channel) {
    case 'web':
      return 'language';
    case 'telegram':
      return 'send';
    case 'whatsapp':
      return 'chat';
    default:
      return 'devices';
  }
}

// Utility: map knowledgeIds on an agent to a comma-separated list of group names.
function getKnowledgeNames(agent) {
  if (!agent.knowledgeIds || agent.knowledgeIds.length === 0) {
    return '-';
  }
  const names = agent.knowledgeIds
    .map((id) => {
      const group = knowledgeGroups.value.find((g) => g.id === id);
      return group ? group.name : null;
    })
    .filter(Boolean);
  return names.length > 0 ? names.join(', ') : '-';
}

function sendSandboxMessage() {
  if (!sandboxInput.value) return;
  testMessages.value.push({ sender: 'admin', text: sandboxInput.value });
  const userInput = sandboxInput.value;
  sandboxInput.value = '';
  // simulate agent response
  setTimeout(() => {
    testMessages.value.push({ sender: 'agent', text: `Echo: ${userInput}` });
  }, 500);
}

// Toggle the agent-level approve mode.  When enabled all agent replies to
// clients will be queued for approval.  Persist the setting via the
// backend and update the local state upon success.
async function toggleApproveMode(event) {
  const checked = !!event.target.checked;
  try {
    await apiClient.patch(`/agents/${agentId}/approve_mode`, { approveRequired: checked });
    agent.value.approveRequired = checked;
    agentStore.setManualApprove(checked);
    // Show a generic success message.  Use the existing statusUpdated key as
    // fallback if translation does not exist.
    showToast(langStore.t('requiresApproval') + ' ' + (langStore.t('statusUpdated') || 'updated'), 'success');
  } catch (e) {
    console.error('Failed to update approve mode', e);
    showToast(langStore.t('failedUpdate') || 'Failed to update', 'error');
  }
}

/**
 * Return Tailwind classes for message bubbles based on sender.
 * Admin messages are aligned right with yellow background,
 * agent messages are aligned left with green background.
 */
function messageBubbleClasses(sender) {
  if (sender === 'admin') {
    // admin/operator: yellow bubble
    return 'bg-yellow-500 text-white dark:bg-yellow-600 dark:text-gray-900';
  }
  if (sender === 'agent') {
    // agent replies: green bubble
    return 'bg-green-500 text-white dark:bg-green-600 dark:text-gray-900';
  }
  // system or other: neutral
  return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
}

// Open the edit agent form in the side panel.  Pass the agent ID and a
// callback to refresh the details upon successful save.
function editAgent() {
  editing.value = true;
}
</script>

<style scoped>
.border-default {
  border-color: var(--c-border);
}
.bg-secondary {
  background-color: var(--c-bg-secondary);
}
.form-input {
  @apply w-full p-2.5 rounded-lg border;
  background-color: var(--c-bg-input, var(--c-bg-primary));
  border-color: var(--c-border);
}
.form-input:focus {
  @apply ring-2 border-transparent outline-none;
  --tw-ring-color: var(--c-text-brand);
}
</style>
