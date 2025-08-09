import { reactive } from 'vue'

const STORAGE_KEY = 'settings.v1'

const state = reactive({
  notificationsEnabled: false,
  workspaceSettings: {
    attentionSLA: 5,
  },
})

function hydrate() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    state.notificationsEnabled = !!saved.notificationsEnabled
    if (saved.workspaceSettings && typeof saved.workspaceSettings.attentionSLA === 'number') {
      state.workspaceSettings.attentionSLA = saved.workspaceSettings.attentionSLA
    }
  } catch {
    /* ignore */
  }
}

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        notificationsEnabled: state.notificationsEnabled,
        workspaceSettings: { ...state.workspaceSettings },
      }),
    )
  } catch {
    /* ignore */
  }
}

async function toggleNotifications(value) {
  if (value) {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission()
      state.notificationsEnabled = perm === 'granted'
    } else {
      state.notificationsEnabled = false
    }
  } else {
    state.notificationsEnabled = false
  }
  persist()
}

hydrate()

export const settingsStore = { state, toggleNotifications }
