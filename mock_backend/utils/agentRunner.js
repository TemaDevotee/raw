const { nanoid } = require('nanoid')
const { emit } = require('./eventBus')
const { readDb, writeDb } = require('./db')
const { getProvider } = require('../agent/provider-registry')
const { getSettings, defaults } = require('./agentSettings')
const estimateTokens = require('./tokens')

const running = new Map() // chatId -> AbortController

function findChat(chatId) {
  const db = readDb()
  for (const t of db.tenants || []) {
    const c = (t.chats || []).find(ch => ch.id === chatId)
    if (c) return { db, tenant: t, chat: c }
  }
  return null
}

function buildContext(chat, systemPrompt, maxTokensForPrompt) {
  const msgs = []
  let tokens = estimateTokens(systemPrompt)
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    const m = chat.messages[i]
    const role = m.role === 'agent' ? 'assistant' : 'user'
    const t = estimateTokens(m.text)
    if (tokens + t > maxTokensForPrompt) break
    tokens += t
    msgs.unshift({ role, content: m.text })
  }
  return { messages: msgs }
}

async function run(chatId) {
  const found = findChat(chatId)
  if (!found) return false
  const { tenant, chat, db } = found
  const billing = tenant.billing || {}
  const available = (billing.tokenQuota || 0) - (billing.tokenUsed || 0)
  if (available <= 0) {
    chat.agentState = 'error'
    writeDb(db)
    emit(tenant.id, { type: 'agent:state', chatId, state: 'error' })
    emit(tenant.id, { type: 'agent:error', chatId, code: 'quota_exceeded', message: 'Token quota exceeded' })
    return false
  }
  const settings = (getSettings(chatId) || { settings: defaults }).settings
  const provider = getProvider(settings.provider)
  const controller = new AbortController()
  running.set(chatId, controller)
  chat.agentState = 'typing'
  writeDb(db)
  emit(tenant.id, { type: 'agent:state', chatId, state: 'typing' })
  emit(tenant.id, { type: 'agent:typing', chatId, step: 'start' })
  let text = ''
  try {
    const ctx = buildContext(chat, settings.systemPrompt, settings.maxTokens * 2)
    const result = await provider.generate({
      chat: ctx,
      systemPrompt: settings.systemPrompt,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      onToken(delta) {
        text += delta
      },
      abort: controller.signal
    })
    const draft = { id: nanoid(), text: result.text, createdAt: new Date().toISOString() }
    chat.drafts = chat.drafts || []
    chat.drafts.push(draft)
    chat.updatedAt = draft.createdAt
    chat.agentState = 'idle'
    const usageTotal = result.usage.prompt + result.usage.completion
    billing.tokenUsed = (billing.tokenUsed || 0) + usageTotal
    const entry = {
      id: Date.now().toString(),
      time: new Date().toISOString(),
      type: 'agent_usage',
      delta: usageTotal,
      balance: (billing.tokenQuota || 0) - (billing.tokenUsed || 0),
      meta: { chatId, provider: provider.name, usage: result.usage }
    }
    billing.ledger = [entry, ...(billing.ledger || [])]
    writeDb(db)
    emit(tenant.id, { type: 'draft:created', chatId, draft })
    emit(tenant.id, { type: 'agent:typing', chatId, step: 'stop' })
    emit(tenant.id, { type: 'agent:state', chatId, state: 'idle' })
    emit(tenant.id, { type: 'billing:usage', chatId, usage: result.usage })
  } catch (e) {
    chat.agentState = chat.agentState === 'paused' ? 'paused' : 'error'
    writeDb(db)
    emit(tenant.id, { type: 'agent:typing', chatId, step: 'stop' })
    emit(tenant.id, { type: 'agent:state', chatId, state: chat.agentState })
    const code = controller.signal.aborted ? 'cancelled' : 'provider_error'
    emit(tenant.id, { type: 'agent:error', chatId, code, message: e.message })
  } finally {
    running.delete(chatId)
  }
  return true
}

function generate(chatId) {
  if (running.has(chatId)) return false
  run(chatId)
  return true
}

function pauseChat(chatId) {
  const entry = running.get(chatId)
  const found = findChat(chatId)
  if (!found) return false
  found.chat.agentState = 'paused'
  writeDb(found.db)
  emit(found.tenant.id, { type: 'agent:state', chatId, state: 'paused' })
  if (entry) {
    entry.abort()
  }
  return true
}

function resumeChat(chatId) {
  const found = findChat(chatId)
  if (!found) return false
  found.chat.agentState = 'idle'
  writeDb(found.db)
  emit(found.tenant.id, { type: 'agent:state', chatId, state: 'idle' })
  return true
}

module.exports = { generate, pauseChat, resumeChat, buildContext }
