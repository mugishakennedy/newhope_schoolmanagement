import { defineStore } from 'pinia'

import api, { ROLE_KEY, TOKEN_KEY, USER_KEY } from '@/api/client'
import { initials } from '@/utils/format'

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    role: localStorage.getItem(ROLE_KEY) || '',
    user: readUser(),
    loading: false,
    restoring: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => state.role === 'dos',
    isStudent: (state) => state.role === 'student',
    homeRoute: (state) => (state.role === 'dos' ? '/admin' : '/student'),
    displayName: (state) =>
      state.user?.full_name || state.user?.email || 'NewHope member',
    userInitials: (state) => initials(state.user?.full_name || state.user?.email),
    roleLabel: (state) =>
      state.role === 'dos' ? 'Dean of Studies' : 'Student',
  },

  actions: {
    persist() {
      localStorage.setItem(TOKEN_KEY, this.token)
      localStorage.setItem(ROLE_KEY, this.role)
      localStorage.setItem(USER_KEY, JSON.stringify(this.user))
    },

    clear() {
      this.token = ''
      this.role = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(ROLE_KEY)
      localStorage.removeItem(USER_KEY)
    },

    async loginStudent(email, password) {
      this.loading = true
      try {
        const { data } = await api.post('/students/login', { email, password })
        this.token = data.access_token
        this.role = 'student'
        this.user = data.student
        this.persist()
        return data
      } finally {
        this.loading = false
      }
    },

    async loginAdmin(email, password) {
      this.loading = true
      try {
        const form = new URLSearchParams()
        form.append('username', email)
        form.append('password', password)
        const { data } = await api.post('/dos/auth/token', form)
        this.token = data.access_token
        this.role = 'dos'
        this.user = null
        this.persist()
        await this.fetchMe()
        return data
      } finally {
        this.loading = false
      }
    },

    async fetchMe() {
      const endpoint = this.isAdmin ? '/dos/auth/me' : '/students/me'
      const { data } = await api.get(endpoint)
      this.user = data
      this.persist()
      return data
    },

    async restore() {
      if (!this.token) return
      this.restoring = true
      try {
        await this.fetchMe()
      } catch {
        this.clear()
      } finally {
        this.restoring = false
      }
    },

    async logout() {
      const endpoint = this.isAdmin ? '/dos/auth/logout' : '/auth/logout'
      try {
        await api.post(endpoint)
      } catch {
        // Clearing the local session is enough even if the server call fails.
      }
      this.clear()
    },
  },
})
