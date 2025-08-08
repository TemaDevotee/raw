import { reactive } from 'vue'
import { showToast } from '@/stores/toastStore'
import apiClient from '@/api'

const STORAGE_KEY = 'app.state.v2'

function createDefaultWorkspace() {
  return {
    id: crypto.randomUUID(),
    name: 'Workspace 1',
    createdAt: Date.now(),
    isDefault: true,
    connections: [],
    access: {},
  }
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed.workspaces) {
        return parsed
      }
      // legacy single-workspace data migration
      const def = createDefaultWorkspace()
      return {
        currentWorkspaceId: def.id,
        workspaces: [def],
        chatsByWs: { [def.id]: parsed.chats || [] },
        teamsByWs: { [def.id]: parsed.teams || [] },
        bots: parsed.bots || [],
        knowledge: parsed.knowledge || [],
        __version: 2,
      }
    } catch (e) {
      console.warn('Failed to parse state', e)
    }
  }
  const def = createDefaultWorkspace()
  return {
    currentWorkspaceId: def.id,
    workspaces: [def],
    chatsByWs: { [def.id]: [] },
    teamsByWs: { [def.id]: [] },
    bots: [],
    knowledge: [],
    __version: 2,
  }
}

const state = reactive(loadState())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function switchWorkspace(id) {
  state.currentWorkspaceId = id
  persist()
}

async function createWorkspace(name) {
  const ws = {
    id: crypto.randomUUID(),
    name: name || `Workspace ${state.workspaces.length + 1}`,
    createdAt: Date.now(),
    connections: [],
    access: {},
  }
  state.workspaces.push(ws)
  state.chatsByWs[ws.id] = []
  state.teamsByWs[ws.id] = []
  switchWorkspace(ws.id)
  persist()
  // Persist to the backend.  We send the name only so that the
  // server generates its own identifier; we ignore the response as
  // the local ID is already used in the UI.  Errors are swallowed
  // silently but logged to the console.
  try {
    const res = await apiClient.post('/workspaces', { name: ws.name });
    const serverId = res.data && res.data.id ? res.data.id : ws.id;
    if (serverId !== ws.id){
      // rekey state maps to server id
      state.chatsByWs[serverId] = state.chatsByWs[ws.id] || [];
      state.teamsByWs[serverId] = state.teamsByWs[ws.id] || [];
      delete state.chatsByWs[ws.id];
      delete state.teamsByWs[ws.id];
      ws.id = serverId;
      state.currentWorkspaceId = serverId;
    }
  } catch(e){ console.warn('Failed to persist new workspace', e); }
  persist();
  showToast(`Workspace "${ws.name}" создан`, 'success')
  return ws
}

function renameWorkspace(id, name) {
  const ws = state.workspaces.find((w) => w.id === id)
  if (ws) {
    ws.name = name
    persist()
    // Attempt to persist the rename to the backend.  We fire and
    // forget to avoid blocking the UI.  Any error will be logged.
    apiClient
      .patch(`/workspaces/${id}`, { name })
      .catch((e) => console.warn('Failed to rename workspace', e))
  }
}

function deleteWorkspace(id) {
  const index = state.workspaces.findIndex((w) => w.id === id)
  if (index === -1) return
  if (state.workspaces[index].isDefault) return
  const wsId = state.workspaces[index].id
  state.workspaces.splice(index, 1)
  delete state.chatsByWs[id]
  delete state.teamsByWs[id]
  if (state.currentWorkspaceId === id) {
    const def = state.workspaces.find((w) => w.isDefault) || state.workspaces[0]
    state.currentWorkspaceId = def.id
  }
  persist()
  // Attempt to delete on backend.  If the server forbids
  // deletion of the default workspace it will return an error; we
  // ignore errors here as the UI already prevents deleting the
  // default workspace.
  apiClient
    .delete(`/workspaces/${wsId}`)
    .catch((e) => console.warn('Failed to delete workspace', e))
}

function workspaceName(id) {
  return state.workspaces.find((w) => w.id === id)?.name || ''
}

export const workspaceStore = {
  state,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  switchWorkspace,
  workspaceName,
}
