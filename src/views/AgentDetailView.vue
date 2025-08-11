<template>
  <div class="p-10 space-y-6">
    <div v-if="loading" data-testid="agent-skeleton">
      <SkeletonLoader />
    </div>
    <AgentNotFound v-else-if="!agent" />
    <div v-else>
      <header class="flex items-center mb-8 space-x-4">
        <router-link to="/agents" class="btn-secondary">
          <span class="material-icons-outlined mr-1">arrow_back</span>
          {{ langStore.t('backToAll') }}
        </router-link>
        <h1 class="text-3xl font-bold" data-testid="agent-name">{{ agent.name }}</h1>
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
      <div class="bg-secondary p-6 rounded-xl border border-default space-y-4 mt-6">
        <h3 class="text-xl font-semibold mb-2">{{ langStore.t('agent.knowledge.title') }}</h3>
        <p class="text-sm text-muted mb-4">
          {{ langStore.t('agent.knowledge.help') }}
        </p>
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <input
            v-model="knowledge.search"
            :placeholder="langStore.t('agent.knowledge.searchPlaceholder')"
            class="form-input"
          />
          <select v-model="knowledge.selectedId" class="form-select">
            <option value="" disabled>{{ langStore.t('agent.knowledge.addCollection') }}</option>
            <option
              v-for="c in knowledge.availableCollections"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name }}
            </option>
          </select>
          <button
            class="btn-secondary"
            :disabled="!knowledge.selectedId"
            @click="knowledge.addSelected"
          >
            {{ langStore.t('agent.knowledge.addCollection') }}
          </button>
        </div>
        <div v-if="knowledge.links.length === 0" class="text-muted">
          {{ langStore.t('knowledgeNoSources') }}
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted">
              <th class="py-1">{{ langStore.t('agent.knowledge.priority') }}</th>
              <th class="py-1">{{ langStore.t('knowledgeCollections') }}</th>
              <th class="py-1">{{ langStore.t('agent.knowledge.enabled') }}</th>
              <th class="py-1">{{ langStore.t('agent.knowledge.topK') }}</th>
              <th class="py-1">{{ langStore.t('agent.knowledge.maxChunks') }}</th>
              <th class="py-1">{{ langStore.t('agent.knowledge.citations') }}</th>
              <th class="py-1">{{ langStore.t('advanced') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(link, idx) in knowledge.links"
              :key="link.collectionId"
              :class="{
                'text-muted':
                  !knowledgeStore.state.collections.find((c) => c.id === link.collectionId),
              }"
            >
              <td class="py-1">
                <button class="material-icons-outlined text-base" @click="knowledge.moveUp(idx)">
                  arrow_upward
                </button>
                <button class="material-icons-outlined text-base" @click="knowledge.moveDown(idx)">
                  arrow_downward
                </button>
              </td>
              <td class="py-1">
                {{
                  knowledgeStore.state.collections.find((c) => c.id === link.collectionId)?.name ||
                    langStore.t('agent.knowledge.missingCollection')
                }}
              </td>
              <td class="py-1">
                <input type="checkbox" v-model="link.enabled" />
              </td>
              <td class="py-1">
                <input
                  type="number"
                  class="form-input w-20"
                  v-model.number="link.params.topK"
                  min="1"
                  max="20"
                />
              </td>
              <td class="py-1">
                <input
                  type="number"
                  class="form-input w-24"
                  v-model.number="link.params.maxChunks"
                  min="50"
                  max="2000"
                  step="50"
                />
              </td>
              <td class="py-1">
                <input type="checkbox" v-model="link.params.citations" />
              </td>
              <td class="py-1">
                <button class="text-xs underline" @click="link.showAdv = !link.showAdv">
                  {{ link.showAdv ? langStore.t('hide') : langStore.t('advanced') }}
                </button>
              </td>
              <td class="py-1">
                <button
                  class="material-icons-outlined text-base text-[var(--c-text-danger)]"
                  @click="knowledge.removeLink(idx)"
                >
                  delete
                </button>
              </td>
            </tr>
            <tr v-if="link.showAdv" class="bg-secondary/50">
              <td colspan="8" class="p-2">
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div>
                    <label class="block text-xs">{{ langStore.t('agent.knowledge.chunkSize') }}</label>
                    <input type="number" class="form-input w-full" v-model.number="link.params.chunkSize" min="50" max="2000" />
                  </div>
                  <div>
                    <label class="block text-xs">{{ langStore.t('agent.knowledge.chunkOverlap') }}</label>
                    <input type="number" class="form-input w-full" v-model.number="link.params.chunkOverlap" min="0" max="500" />
                  </div>
                  <div>
                    <label class="block text-xs">{{ langStore.t('agent.knowledge.embeddingModel') }}</label>
                    <select v-model="link.params.embeddingModel" class="form-select w-full">
                      <option value="text-embedding-3-small">text-embedding-3-small</option>
                      <option value="text-embedding-3-large">text-embedding-3-large</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs">{{ langStore.t('agent.knowledge.rerankModel') }}</label>
                    <input class="form-input w-full" v-model="link.params.rerankModel" />
                  </div>
                  <div>
                    <label class="block text-xs">{{ langStore.t('agent.knowledge.temperature') }}</label>
                    <input type="number" step="0.1" class="form-input w-full" v-model.number="link.params.temperature" min="0" max="1" />
                  </div>
                  <div>
                    <label class="block text-xs">{{ langStore.t('agent.knowledge.maxContextTokens') }}</label>
                    <input type="number" class="form-input w-full" v-model.number="link.params.maxContextTokens" min="500" max="40000" />
                  </div>
                </div>
                <div class="text-right mt-2">
                  <button class="btn-secondary" @click="knowledge.resetParams(idx)">{{ langStore.t('reset') }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-end mt-4">
          <button
            class="btn-primary"
            :disabled="!knowledge.isValid || knowledge.saving"
            @click="knowledge.save"
          >
            {{
              knowledge.saving
                ? langStore.t('agent.knowledge.saving')
                : langStore.t('agent.knowledge.save')
            }}
          </button>
        </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/api';
import langStore from '@/stores/langStore';
import { agentStore } from '@/stores/agentStore.js';
import { knowledgeStore } from '@/stores/knowledgeStore.js';
import { workspaceStore } from '@/stores/workspaceStore.js';
import { useAgentKnowledge } from './agentKnowledgeLogic.js';
import AgentForm from '@/components/AgentForm.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import AgentNotFound from '@/components/AgentNotFound.vue';
import { showToast } from '@/stores/toastStore';

const route = useRoute();
const agentId = route.params.id;
const agent = ref(null);
const loading = ref(true);
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
  loading.value = true;
  const res = await agentStore.ensure(agentId);
  agent.value = res;
  if (agent.value) {
    agentStore.setManualApprove(!!agent.value.approveRequired);
    agentStore.setKnowledgeLinks(agent.value.knowledgeLinks || []);
    knowledge.links.value = agentStore.state.knowledgeLinks.map((l) => ({
      ...l,
      params: { ...l.params },
    }));
  }
  await new Promise((r) => setTimeout(r, 300));
  loading.value = false;
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
onMounted(() => knowledgeStore.fetchCollections(workspaceStore.state.currentWorkspaceId));

const knowledge = useAgentKnowledge(agentId);

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
