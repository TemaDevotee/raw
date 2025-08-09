import { reactive } from 'vue'
import apiClient from '@/api'

const state = reactive({
  user: JSON.parse(localStorage.getItem('auth.user') || sessionStorage.getItem('auth.user') || 'null'),
  token: localStorage.getItem('auth.token') || sessionStorage.getItem('auth.token') || null,
})

export function isAuthenticated () {
  return (
    localStorage.getItem('authenticated') === 'true' ||
    sessionStorage.getItem('authenticated') === 'true' ||
    !!localStorage.getItem('auth.token') ||
    !!sessionStorage.getItem('auth.token')
  )
}

export async function fetchMe () {
  try {
    const res = await apiClient.get('/auth/me', { headers: tokenHeader() })
    state.user = res.data.user || null
  } catch (e) {
    // ignore in mock; in real app you might clear auth on 401
  }
}

export function tokenHeader () {
  const t = state.token || localStorage.getItem('auth.token') || sessionStorage.getItem('auth.token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export function setAuth ({ token, user, remember }) {
  state.user = user
  state.token = token
  if (remember) {
    localStorage.setItem('auth.token', token)
    localStorage.setItem('auth.user', JSON.stringify(user))
    localStorage.setItem('authenticated', 'true')
    sessionStorage.removeItem('auth.token')
    sessionStorage.removeItem('auth.user')
    sessionStorage.removeItem('authenticated')
  } else {
    sessionStorage.setItem('auth.token', token)
    sessionStorage.setItem('auth.user', JSON.stringify(user))
    sessionStorage.setItem('authenticated', 'true')
    localStorage.removeItem('auth.token')
    localStorage.removeItem('auth.user')
    localStorage.removeItem('authenticated')
  }
}

export function forceLogin (user = { id: 'e2e', name: 'E2E' }) {
  state.user = user
  state.token = 'e2e'
  localStorage.setItem('auth.token', 'e2e')
  localStorage.setItem('auth.user', JSON.stringify(user))
  localStorage.setItem('authenticated', 'true')
  sessionStorage.setItem('auth.token', 'e2e')
  sessionStorage.setItem('auth.user', JSON.stringify(user))
  sessionStorage.setItem('authenticated', 'true')
}

export const authStore = { state, isAuthenticated, fetchMe, tokenHeader, setAuth, forceLogin }
