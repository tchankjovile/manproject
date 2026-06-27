import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    accessToken: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    isAdmin: (state) => state.user?.role === 'admin'
  },

  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.post('/api/auth/login/', credentials)
        this.accessToken = data.access
        this.refreshToken = data.refresh
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        await this.fetchProfile()
        return true
      } catch (err) {
        this.error = err.response?.data?.detail || 'Identifiants incorrects'
        return false
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null
      try {
        await axios.post('/api/auth/register/', userData)
        return true
      } catch (err) {
        this.error = err.response?.data || 'Erreur lors de l\'inscription'
        return false
      } finally {
        this.loading = false
      }
    },

    async fetchProfile() {
      try {
        const { data } = await apiClient.get('/auth/profile/')
        this.user = data
        localStorage.setItem('user', JSON.stringify(data))
      } catch (err) {
        console.error('Failed to fetch profile', err)
      }
    },

    logout() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  }
})
