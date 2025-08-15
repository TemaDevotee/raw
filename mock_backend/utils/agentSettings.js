const { readDb, writeDb } = require('./db')

const defaults = {
  provider: 'mock',
  model: process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini',
  systemPrompt: 'You are a helpful support agent.',
  temperature: 0.3,
  maxTokens: 256
}

function getSettings(chatId) {
  const db = readDb()
  for (const t of db.tenants || []) {
    const chat = (t.chats || []).find(c => c.id === chatId)
    if (chat) return { tenant: t, chat, settings: { ...defaults, ...(chat.agentSettings || {}) } }
  }
  return null
}

function saveSettings(chatId, patch) {
  const db = readDb()
  for (const t of db.tenants || []) {
    const chat = (t.chats || []).find(c => c.id === chatId)
    if (chat) {
      chat.agentSettings = { ...defaults, ...(chat.agentSettings || {}), ...patch }
      writeDb(db)
      return chat.agentSettings
    }
  }
  return null
}

module.exports = { getSettings, saveSettings, defaults }
