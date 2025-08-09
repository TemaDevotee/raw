import { reactive } from 'vue'

const STORAGE_KEY = 'settings.v1'

const state = reactive({
  notificationsEnabled: false,
})

function hydrate() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    state.notificationsEnabled = !!saved.notificationsEnabled
  } catch {
    /* ignore */
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      notificationsEnabled: state.notificationsEnabled,
    }))
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
