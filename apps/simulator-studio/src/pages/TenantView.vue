<template>
  <div>
    <h1 class="text-xl mb-2 flex items-center">
      {{ detail.tenant?.name }}
      <Tag v-if="detail.tenant" class="ml-2">{{ detail.tenant.plan }}</Tag>
    </h1>
    <div v-if="detail.billing" class="mb-4">
      <ProgressBar :percent="tokenPercent" />
      <p class="text-xs mt-1">
        {{ detail.billing.tokensUsed }} / {{ detail.billing.tokensLimit }} tokens
      </p>
    </div>
    <nav class="mb-4 space-x-2">
      <button
        v-for="t in tabs"
        :key="t.key"
        @click="select(t.key)"
        class="px-2 py-1 border-b-2"
        :class="detail.activeTab === t.key ? 'border-black' : 'border-transparent'"
      >
        {{ t.en }} / {{ t.ru }}
      </button>
    </nav>

    <div v-if="detail.activeTab === 'workspaces'">
      <Table>
        <template #head>
          <th class="text-left">Name / Имя</th>
          <th class="text-left">Created / Создано</th>
          <th class="text-left">Agents / Агенты</th>
          <th class="text-left">Chats / Чаты</th>
        </template>
        <tr v-for="w in detail.workspaces" :key="w.id">
          <td>{{ w.name }}</td>
          <td>{{ formatDate(w.createdAt) }}</td>
          <td>{{ w.agentsCount }}</td>
          <td>{{ w.chatsCount }}</td>
        </tr>
      </Table>
    </div>

    <div v-else-if="detail.activeTab === 'agents'">
      <Table>
        <template #head>
          <th class="text-left">Name / Имя</th>
          <th class="text-left">Model / Модель</th>
          <th class="text-left">Status / Статус</th>
        </template>
        <tr v-for="a in detail.agents" :key="a.id">
          <td>{{ a.name }}</td>
          <td>{{ a.model }}</td>
          <td>{{ a.status }}</td>
        </tr>
      </Table>
    </div>

    <div v-else-if="detail.activeTab === 'knowledge'">
      <div class="flex">
        <aside class="w-1/3 pr-4">
          <KnowledgeCollections
            :collections="knowledge.collections"
            :current="currentCollection"
            :used-m-b="knowledge.usedMB"
            :quota-m-b="knowledge.quotaMB"
            @select="selectCollection"
            @new="createCollection"
          />
        </aside>
        <div class="flex-1">
          <KnowledgeFilesTable
            :files="currentFiles"
            :progress="knowledge.progress"
            @upload="file => knowledge.uploadFile(currentCollection!, file)"
            @download="id => knowledge.downloadFile(id)"
            @delete="id => knowledge.deleteFile(currentCollection!, id)"
          />
        </div>
      </div>
      <p v-if="knowledge.error" class="text-red-500 text-sm mt-2">{{ knowledge.error }}</p>
    </div>

    <div v-else-if="detail.activeTab === 'chats'">
      <div class="mb-2">
        <button class="underline" @click="showNewChat = true">
          New Chat / Новый чат
        </button>
      </div>
      <Table>
        <template #head>
          <th class="text-left">ID</th>
          <th class="text-left">Subject / Тема</th>
          <th class="text-left">Status / Статус</th>
          <th class="text-left">Updated / Обновлён</th>
          <th></th>
        </template>
        <tr v-for="c in detail.chats" :key="c.id">
          <td>{{ c.id }}</td>
          <td>{{ c.subject || '-' }}</td>
          <td>{{ c.status }}</td>
          <td>{{ formatDate(c.updatedAt) }}</td>
          <td>
            <button class="underline" @click="openConsole(c.id)">
              Open Console / Открыть консоль
            </button>
          </td>
        </tr>
      </Table>

      <div v-if="showNewChat" class="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div class="bg-white p-4 w-64">
          <h3 class="font-bold mb-2">New Chat / Новый чат</h3>
          <label class="block text-sm">Workspace</label>
          <input v-model="newChat.workspaceId" class="border w-full mb-2" />
          <label class="block text-sm">Subject / Тема</label>
          <input v-model="newChat.subject" class="border w-full mb-2" />
          <label class="block text-sm">Client name / Имя клиента</label>
          <input v-model="newChat.client" class="border w-full mb-2" />
          <label class="text-sm">
            <input type="checkbox" v-model="newChat.addAgent" class="mr-1" />
            Add agent / Добавить агента
          </label>
          <div class="mt-2 text-right space-x-2">
            <button class="underline" @click="showNewChat = false">Cancel / Отмена</button>
            <button class="underline" @click="createChat">Create / Создать</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="detail.activeTab === 'billing'">
      <Card v-if="billing.summary" class="mb-4">
        <p>Plan: {{ billing.summary.plan }}</p>
        <p class="mt-2 mb-1">Tokens / Токены</p>
        <ProgressBar :percent="tokenPercent" />
        <p class="text-xs mt-1">
          {{ billing.summary.tokenUsed }} / {{ billing.summary.tokenQuota }}
        </p>
        <div class="mt-2 space-x-2">
          <button class="underline" @click="credit">Credit / Начислить</button>
          <button class="underline" @click="debit">Debit / Списать</button>
          <button class="underline" @click="resetPeriod">Reset Period / Сбросить период</button>
        </div>
        <p class="mt-2 mb-1">Storage / Хранилище</p>
        <ProgressBar :percent="storagePercent" />
        <p class="text-xs mt-1">
          {{ billing.summary.storageUsedMB }} / {{ billing.summary.storageQuotaMB }} MB
        </p>
        <p class="mt-2 text-xs">
          {{ formatDate(billing.summary.period.start) }} -
          {{ formatDate(billing.summary.period.end) }}
        </p>
      </Card>
      <Table v-if="billing.ledger.length">
        <template #head>
          <th class="text-left">Time / Время</th>
          <th class="text-left">Type / Тип</th>
          <th class="text-left">Delta</th>
          <th class="text-left">Balance</th>
          <th class="text-left">Reason / Причина</th>
        </template>
        <tr v-for="e in billing.ledger" :key="e.id">
          <td>{{ formatDate(e.time) }}</td>
          <td>{{ e.type }}</td>
          <td>{{ e.delta }}</td>
          <td>{{ e.balance }}</td>
          <td>{{ e.reason }}</td>
        </tr>
      </Table>
      <p v-else>No entries / Нет записей</p>
    </div>

    <div v-else-if="detail.activeTab === 'integrations'">
      <Card>
        <ul v-if="detail.tenant?.integrations?.length">
          <li v-for="i in detail.tenant.integrations" :key="i.provider" class="mb-1">
            <Tag>{{ i.provider }} - {{ i.status }}</Tag>
          </li>
        </ul>
        <p v-else>No integrations / Интеграции отсутствуют</p>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTenantDetailStore } from '../stores/tenantDetail'
import { useKnowledgeStore } from '../stores/knowledge'
import * as admin from '../api/admin'
import Tag from '../components/Tag.vue'
import Card from '../components/Card.vue'
import Table from '../components/Table.vue'
import ProgressBar from '../components/ProgressBar.vue'
import KnowledgeCollections from '../components/KnowledgeCollections.vue'
import KnowledgeFilesTable from '../components/KnowledgeFilesTable.vue'
import { useBillingStore } from '../stores/billing'

const route = useRoute()
const router = useRouter()
const detail = useTenantDetailStore()
const knowledge = useKnowledgeStore()
const billing = useBillingStore()

const tabs = [
  { key: 'workspaces', en: 'Workspaces', ru: 'Рабочие пространства' },
  { key: 'agents', en: 'Agents', ru: 'Агенты' },
  { key: 'knowledge', en: 'Knowledge', ru: 'Знания' },
  { key: 'chats', en: 'Chats', ru: 'Чаты' },
  { key: 'billing', en: 'Billing', ru: 'Биллинг' },
  { key: 'integrations', en: 'Integrations', ru: 'Интеграции' }
]

const currentCollection = ref<string | null>(null)
const currentFiles = computed(() =>
  currentCollection.value ? knowledge.filesByCollection[currentCollection.value] || [] : []
)
const showNewChat = ref(false)
const newChat = reactive({
  workspaceId: '',
  subject: '',
  client: '',
  addAgent: false
})


const tokenPercent = computed(() => {
  if (!billing.summary) return 0
  return Math.min(
    100,
    (billing.summary.tokenUsed / billing.summary.tokenQuota) * 100
  )
})

const storagePercent = computed(() => {
  if (!billing.summary) return 0
  return Math.min(
    100,
    (billing.summary.storageUsedMB / billing.summary.storageQuotaMB) * 100
  )
})

function formatDate(d?: string) {
  return d ? new Date(d).toLocaleString() : ''
}


function select(tab: string) {
  detail.activeTab = tab
  router.replace({ query: { ...route.query, tab } })
  loadTab()
}

function selectCollection(id: string) {
  currentCollection.value = id
  knowledge.listFiles(id)
}

async function createCollection() {
  const name = prompt('Name / Название') || ''
  if (name) {
    await knowledge.createCollection(name)
    if (knowledge.collections.length) {
      currentCollection.value = knowledge.collections[knowledge.collections.length - 1].id
      knowledge.listFiles(currentCollection.value)
    }
  }
}

async function credit() {
  const amount = parseInt(prompt('Amount / Сумма') || '0', 10)
  const reason = prompt('Reason / Причина') || ''
  if (amount > 0) await billing.credit(amount, reason)
}

async function debit() {
  const amount = parseInt(prompt('Amount / Сумма') || '0', 10)
  const reason = prompt('Reason / Причина') || ''
  if (amount > 0) await billing.debit(amount, reason)
}

async function resetPeriod() {
  const reason = prompt('Reason / Причина') || ''
  await billing.reset(reason)
}

function openConsole(id: string) {
  router.push(`/tenants/${route.params.tenantId}/chats/${id}/console`)
}

async function createChat() {
  const tenantId = route.params.tenantId as string
  const payload: any = {
    tenantId,
    workspaceId: newChat.workspaceId,
    subject: newChat.subject,
    participants: [{ role: 'user', name: newChat.client }]
  }
  if (newChat.addAgent) {
    payload.participants.push({ role: 'agent', name: 'Agent' })
  }
  const res = await admin.createChat(payload)
  showNewChat.value = false
  router.push(`/tenants/${tenantId}/chats/${res.chatId}/console`)
}

function loadTab() {
  const id = route.params.tenantId as string
  switch (detail.activeTab) {
    case 'workspaces':
      detail.loadWorkspaces(id)
      break
    case 'agents':
      detail.loadAgents(id)
      break
    case 'knowledge':
      knowledge.load(id).then(() => {
        if (!currentCollection.value && knowledge.collections.length) {
          currentCollection.value = knowledge.collections[0].id
          knowledge.listFiles(currentCollection.value)
        }
      })
      break
    case 'chats':
      detail.loadChats(id)
      break
    case 'billing':
      billing.load(id)
      break
  }
}

onMounted(async () => {
  const id = route.params.tenantId as string
  await detail.loadTenant(id)
  detail.activeTab = (route.query.tab as string) || 'workspaces'
  loadTab()
})
</script>
