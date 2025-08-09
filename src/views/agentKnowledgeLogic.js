import { ref, computed } from 'vue'
import { agentStore } from '@/stores/agentStore.js'
import { knowledgeStore } from '@/stores/knowledgeStore.js'
import { authStore } from '@/stores/authStore'
import { showToast } from '@/stores/toastStore'
import langStore from '@/stores/langStore'
import * as agentsApi from '@/api/agents.js'

export function useAgentKnowledge(agentId) {
  const links = ref(
    agentStore.state.knowledgeLinks.map((l) => ({
      ...l,
      params: { ...l.params },
    })),
  )
  const search = ref('')
  const selectedId = ref('')
  const saving = ref(false)

  const availableCollections = computed(() => {
    const uid = authStore.state.user?.id
    return knowledgeStore.state.collections.filter(
      (c) =>
        !links.value.some((l) => l.collectionId === c.id) &&
        c.name.toLowerCase().includes(search.value.toLowerCase()) &&
        (c.visibility !== 'private' || (c.editors || []).includes(uid)),
    )
  })

  function addSelected() {
    if (!selectedId.value) return
    links.value.push({
      collectionId: selectedId.value,
      enabled: true,
      params: {
        topK: 5,
        maxChunks: 500,
        citations: false,
        chunkSize: 500,
        chunkOverlap: 50,
        embeddingModel: 'text-embedding-3-small',
        rerankModel: '',
        temperature: 0,
        maxContextTokens: 4000,
        priority: links.value.length,
      },
    })
    selectedId.value = ''
  }

  function removeLink(index) {
    links.value.splice(index, 1)
    updatePriorities()
  }

  function move(index, delta) {
    const newIndex = index + delta
    if (newIndex < 0 || newIndex >= links.value.length) return
    const [item] = links.value.splice(index, 1)
    links.value.splice(newIndex, 0, item)
    updatePriorities()
  }

  function updatePriorities() {
    links.value.forEach((l, i) => (l.params.priority = i))
  }

  const isValid = computed(() =>
    links.value.every(
      (l) =>
        l.params.topK >= 1 &&
        l.params.topK <= 20 &&
        l.params.maxChunks >= 50 &&
        l.params.maxChunks <= 2000 &&
        l.params.chunkSize >= 50 &&
        l.params.chunkSize <= 2000 &&
        l.params.chunkOverlap >= 0 &&
        l.params.chunkOverlap <= 500 &&
        l.params.temperature >= 0 &&
        l.params.temperature <= 1 &&
        l.params.maxContextTokens >= 500 &&
        l.params.maxContextTokens <= 40000,
    ),
  )

  function resetParams(idx) {
    const pri = links.value[idx].params.priority
    links.value[idx].params = {
      topK: 5,
      maxChunks: 500,
      citations: false,
      chunkSize: 500,
      chunkOverlap: 50,
      embeddingModel: 'text-embedding-3-small',
      rerankModel: '',
      temperature: 0,
      maxContextTokens: 4000,
      priority: pri,
    }
  }

  async function save() {
    if (!isValid.value || saving.value) return
    saving.value = true
    const payload = {
      links: links.value.map((l, i) => ({
        collectionId: l.collectionId,
        enabled: l.enabled,
        params: { ...l.params, priority: i },
      })),
    }
    const snapshot = agentStore.state.knowledgeLinks.map((l) => ({
      ...l,
      params: { ...l.params },
    }))
    try {
      await agentsApi.patchKnowledge(agentId, payload)
      agentStore.setKnowledgeLinks(payload.links)
      showToast(langStore.t('agent.knowledge.saved'), 'success')
    } catch (e) {
      links.value = snapshot
      showToast(langStore.t('agent.knowledge.saveFailed'), 'error')
    } finally {
      saving.value = false
    }
  }

  return {
    links,
    search,
    selectedId,
    availableCollections,
    addSelected,
    removeLink,
    moveUp: (i) => move(i, -1),
    moveDown: (i) => move(i, 1),
    resetParams,
    save,
    isValid,
    saving,
  }
}
