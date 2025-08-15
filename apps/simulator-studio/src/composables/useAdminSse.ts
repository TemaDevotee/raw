import { useRealtimeStore } from '../stores/realtime'
import { useChatConsoleStore } from '../stores/chatConsole'
import { useAgentStore } from '../stores/agent'
import { useAuthStore } from '../stores/auth'

const BASE = import.meta.env.VITE_ADMIN_API_BASE
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY

export function useAdminSse(tenantId: string, chatId?: string) {
  const rt = useRealtimeStore()
  const chats = useChatConsoleStore()
  const agent = useAgentStore()
  const auth = useAuthStore()
  let es: EventSource | null = null
  let retry = 1000

  function connect() {
    if (typeof EventSource === 'undefined') { rt.setStatus('error'); return }
    rt.setStatus('connecting')
    let url = `${BASE}/admin/events?tenant=${tenantId}`
    if (chatId) url += `&chat=${chatId}`
    if (auth.token) url += `&token=${auth.token}`
    if (ADMIN_KEY) url += `&key=${ADMIN_KEY}`
    es = new EventSource(url)
    es.onopen = () => { retry = 1000; rt.setStatus('open') }
    es.onerror = () => {
      rt.setStatus('connecting')
      es?.close()
      retry = Math.min(retry * 2, 30000)
      setTimeout(connect, retry)
    }
    es.addEventListener('heartbeat', (ev) => {
      const d = JSON.parse(ev.data)
      rt.setBeat(d.ts)
    })
    es.addEventListener('message:new', (ev) => {
      const d = JSON.parse(ev.data)
      chats.upsertMessage(d.chatId, d.message)
    })
    es.addEventListener('draft:created', (ev) => {
      const d = JSON.parse(ev.data)
      chats.upsertDraft(d.chatId, d.draft)
    })
    es.addEventListener('draft:removed', (ev) => {
      const d = JSON.parse(ev.data)
      chats.removeDraft(d.chatId, d.draftId)
    })
    es.addEventListener('presence:update', (ev) => {
      const d = JSON.parse(ev.data)
      chats.setPresence(d.chatId, d.participants)
    })
    es.addEventListener('chat:status', (ev) => {
      const d = JSON.parse(ev.data)
      chats.setStatus(d.chatId, d.status)
    })
    es.addEventListener('agent:state', (ev) => {
      const d = JSON.parse(ev.data)
      agent.setState(d.chatId, d.state)
    })
    es.addEventListener('agent:typing', (ev) => {
      const d = JSON.parse(ev.data)
      agent.setTyping(d.chatId, d.step === 'start')
    })
    es.addEventListener('agent:error', (ev) => {
      const d = JSON.parse(ev.data)
      agent.setError(d.chatId, { code: d.code, message: d.message })
    })
  }
  connect()
  function close() {
    es?.close()
    rt.setStatus('closed')
  }
  return { close }
}
