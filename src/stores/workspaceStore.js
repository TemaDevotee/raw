import { reactive } from 'vue'
import apiClient from '@/api'
import { showToast } from '@/stores/toastStore'

const STORAGE_KEY = 'app.state.v2'
const VERSION = 2
const DEFAULT_WORKSPACE = { id: 'ws_default', name: 'Default' }

const state = reactive({
  workspaces: [],
  currentWorkspaceId: null,
})

function persist() {
  const data = {
    workspaces: state.workspaces.map((w) => ({ id: w.id, name: w.name })),
    currentWorkspaceId: state.currentWorkspaceId,
    version: VERSION,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function hydrate() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      let workspaces = Array.isArray(parsed.workspaces)
        ? parsed.workspaces.filter((w) => w && w.id && w.name)
        : []
      if (workspaces.length === 0 && parsed.workspace) {
        // v1 single-workspace shape
        workspaces = [parsed.workspace]
      }
      if (!workspaces.some((w) => w.id === DEFAULT_WORKSPACE.id)) {
        workspaces.unshift({ ...DEFAULT_WORKSPACE })
      }
      state.workspaces = workspaces
      state.currentWorkspaceId = workspaces.some(
        (w) => w.id === parsed.currentWorkspaceId,
      )
        ? parsed.currentWorkspaceId
        : workspaces[0].id
      persist()
      return
    } catch (e) {
      console.warn('Failed to parse workspace state', e)
    }
  }
  state.workspaces = [{ ...DEFAULT_WORKSPACE }]
  state.currentWorkspaceId = DEFAULT_WORKSPACE.id
  persist()
}

function currentWorkspace() {
  return state.workspaces.find((w) => w.id === state.currentWorkspaceId) || null
}

function hasMultiple() {
  return state.workspaces.length > 1
}

function createWorkspace(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) throw new Error('Workspace name required')
  const ws = { id: crypto.randomUUID(), name: trimmed }
  state.workspaces.push(ws)
  state.currentWorkspaceId = ws.id
  persist()
  void apiClient.post('/workspaces', { name: trimmed }).catch(() => {})
  showToast(`Workspace "${ws.name}" создан`, 'success')
  return ws
}

function renameWorkspace(id, name) {
  const trimmed = (name || '').trim()
  if (!trimmed) throw new Error('Workspace name required')
  const ws = state.workspaces.find((w) => w.id === id)
  if (!ws) throw new Error('Workspace not found')
  ws.name = trimmed
  persist()
  void apiClient.patch(`/workspaces/${id}`, { name: trimmed }).catch(() => {})
}

function deleteWorkspace(id) {
  if (id === DEFAULT_WORKSPACE.id) throw new Error('Cannot delete default workspace')
  const index = state.workspaces.findIndex((w) => w.id === id)
  if (index === -1) return
  state.workspaces.splice(index, 1)
  if (state.currentWorkspaceId === id) {
    const fallback =
      state.workspaces[index] ||
      state.workspaces[index - 1] ||
      state.workspaces.find((w) => w.id === DEFAULT_WORKSPACE.id) ||
      null
    state.currentWorkspaceId = fallback ? fallback.id : null
  }
  persist()
  void apiClient.delete(`/workspaces/${id}`).catch(() => {})
}

function selectWorkspace(id) {
  if (!state.workspaces.some((w) => w.id === id)) {
    throw new Error('Workspace not found')
  }
  state.currentWorkspaceId = id
  persist()
}

hydrate()

export const workspaceStore = {
  state,
  DEFAULT_WORKSPACE_ID: DEFAULT_WORKSPACE.id,
  hydrate,
  persist,
  currentWorkspace,
  hasMultiple,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  selectWorkspace,
}
