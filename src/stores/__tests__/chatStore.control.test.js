import { describe, it, expect, beforeEach } from 'vitest'

let chatStore, agentStore

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

beforeEach(async () => {
  global.localStorage = mockStorage()
  ;({ chatStore } = await import('../chatStore.js'))
  ;({ agentStore } = await import('../agentStore.js'))
  chatStore.state.chats = [{ id: '1', status: 'live', controlBy: 'agent' }]
  agentStore.state.manualApprove = false
})

describe('chatStore control', () => {
  it('composerEnabled respects holder', () => {
    chatStore.state.chats[0].controlBy = 'operator'
    chatStore.state.chats[0].heldBy = 'me'
    expect(chatStore.composerEnabled('1', 'me')).toBe(true)
    expect(chatStore.composerEnabled('1', 'other')).toBe(false)
  })

  it('effectiveManualApprove forces true when operator in control', () => {
    chatStore.state.chats[0].controlBy = 'operator'
    chatStore.state.chats[0].heldBy = 'me'
    expect(chatStore.effectiveManualApprove('1')).toBe(true)
    chatStore.state.chats[0].controlBy = 'agent'
    expect(chatStore.effectiveManualApprove('1')).toBe(false)
    agentStore.state.manualApprove = true
    expect(chatStore.effectiveManualApprove('1')).toBe(true)
  })
})
