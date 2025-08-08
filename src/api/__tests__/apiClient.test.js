import { describe, it, expect, beforeEach, vi } from 'vitest'

// The apiClient attaches the current workspaceId to scoped resources.  We
// stub fetch to inspect the URL it constructs.  We also stub
// workspaceStore to provide a predictable currentWorkspaceId.

// Mock the workspaceStore used in apiClient.  Because apiClient
// imports workspaceStore directly, we need to use vi.mock to
// override the module.  The mocked module exposes a reactive state
// object with a currentWorkspaceId property that we can assign
// values to in our tests.
vi.mock('@/stores/workspaceStore', () => {
  return {
    workspaceStore: {
      state: {
        currentWorkspaceId: 'ws-test',
      },
    },
  }
})

// Mock the toast store so errors don't throw when apiClient tries to
// show toasts during tests.
vi.mock('@/stores/toastStore', () => {
  return {
    showToast: vi.fn(),
  }
})

// Now import apiClient after mocks are defined
import apiClient from '../index.js'

describe('apiClient', () => {
  let fetchSpy

  beforeEach(() => {
    // Reset the fetch spy before each test
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({}),
    })
    global.fetch = fetchSpy
  })

  it('attaches workspaceId query to scoped GET requests', async () => {
    await apiClient.get('/chats')
    expect(fetchSpy).toHaveBeenCalled()
    const url = new URL(fetchSpy.mock.calls[0][0])
    expect(url.searchParams.get('workspaceId')).toBe('ws-test')
  })

  it('attaches workspaceId query to scoped POST requests', async () => {
    await apiClient.post('/teams', { name: 'Team 1' })
    expect(fetchSpy).toHaveBeenCalled()
    const url = new URL(fetchSpy.mock.calls[0][0])
    expect(url.searchParams.get('workspaceId')).toBe('ws-test')
  })

  it('does not attach workspaceId to unscoped requests', async () => {
    await apiClient.get('/account')
    expect(fetchSpy).toHaveBeenCalled()
    const url = new URL(fetchSpy.mock.calls[0][0])
    expect(url.searchParams.get('workspaceId')).toBe(null)
  })
})