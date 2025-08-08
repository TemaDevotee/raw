import { describe, it, expect, beforeEach, vi } from 'vitest'

function mockStorage() {
  let store = {}
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v)
    },
    removeItem: (k) => {
      delete store[k]
    },
    clear: () => {
      store = {}
    },
  }
}

beforeEach(() => {
  vi.resetModules()
  globalThis.localStorage = mockStorage()
})

describe('workspaceStore', () => {
  it('creates default workspace', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    expect(workspaceStore.state.workspaces.length).toBe(1)
    expect(workspaceStore.state.workspaces[0].isDefault).toBe(true)
  })

  it('creates and switches workspace', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    const ws = workspaceStore.createWorkspace()
    expect(workspaceStore.state.workspaces.length).toBe(2)
    expect(workspaceStore.state.currentWorkspaceId).toBe(ws.id)
  })

  it('cannot delete default workspace', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    const defId = workspaceStore.state.workspaces[0].id
    workspaceStore.deleteWorkspace(defId)
    expect(workspaceStore.state.workspaces.length).toBe(1)
  })

  it('deletes non-default workspace and falls back to default', async () => {
    const { workspaceStore } = await import('../workspaceStore.js')
    const ws = workspaceStore.createWorkspace()
    workspaceStore.switchWorkspace(ws.id)
    workspaceStore.deleteWorkspace(ws.id)
    expect(workspaceStore.state.workspaces.length).toBe(1)
    expect(workspaceStore.state.currentWorkspaceId).toBe(
      workspaceStore.state.workspaces[0].id,
    )
  })
})
