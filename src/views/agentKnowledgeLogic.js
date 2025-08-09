import { ref, computed } from 'vue'
import { agentStore } from '@/stores/agentStore.js'
import { knowledgeStore } from '@/stores/knowledgeStore.js'
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

  const availableCollections = computed(() =>
    knowledgeStore.state.collections.filter(
      (c) =>
        !links.value.some((l) => l.collectionId === c.id) &&
        c.name.toLowerCase().includes(search.value.toLowerCase()),
    ),
  )

  function addSelected() {
    if (!selectedId.value) return
    links.value.push({
      collectionId: selectedId.value,
      enabled: true,
      params: {
        topK: 5,
        maxChunks: 500,
        citations: false,
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
        l.params.maxChunks <= 2000,
    ),
  )

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
    save,
    isValid,
    saving,
  }
}
