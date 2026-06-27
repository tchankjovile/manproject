import { defineStore } from 'pinia'
import apiClient from '@/api/client'

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [],
    currentProject: null,
    tasks: [],
    allUsers: [],
    loading: false,
    error: null,
    searchQuery: ''
  }),

  getters: {
    filteredProjects: (state) => {
      if (!state.searchQuery) return state.projects
      const q = state.searchQuery.toLowerCase()
      return state.projects.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
    },
    todoTasks: (state) => state.tasks.filter(t => t.status === 'TODO'),
    inProgressTasks: (state) => state.tasks.filter(t => t.status === 'IN_PROGRESS'),
    doneTasks: (state) => state.tasks.filter(t => t.status === 'DONE')
  },

  actions: {
    // --- PROJECTS ---
    async fetchProjects() {
      this.loading = true
      try {
        const { data } = await apiClient.get('/projects/')
        this.projects = data.results || data
      } catch (err) {
        this.error = 'Erreur lors du chargement des projets'
      } finally {
        this.loading = false
      }
    },

    async fetchProject(id) {
      this.loading = true
      try {
        const { data } = await apiClient.get(`/projects/${id}/`)
        this.currentProject = data
      } catch (err) {
        this.error = 'Projet introuvable'
      } finally {
        this.loading = false
      }
    },

    async createProject(projectData) {
      const { data } = await apiClient.post('/projects/', projectData)
      this.projects.unshift(data)
      return data
    },

    async updateProject(id, projectData) {
      const { data } = await apiClient.patch(`/projects/${id}/`, projectData)
      const idx = this.projects.findIndex(p => p.id === id)
      if (idx !== -1) this.projects[idx] = data
      this.currentProject = data
      return data
    },

    async deleteProject(id) {
      await apiClient.delete(`/projects/${id}/`)
      this.projects = this.projects.filter(p => p.id !== id)
    },

    // --- TASKS ---
    async fetchTasks(projectId) {
      this.loading = true
      try {
        const { data } = await apiClient.get(`/tasks/?project=${projectId}`)
        this.tasks = data.results || data
      } catch (err) {
        this.error = 'Erreur lors du chargement des tâches'
      } finally {
        this.loading = false
      }
    },

    async createTask(taskData) {
      const { data } = await apiClient.post('/tasks/', taskData)
      this.tasks.push(data)
      return data
    },

    async updateTask(id, taskData) {
      const { data } = await apiClient.patch(`/tasks/${id}/`, taskData)
      const idx = this.tasks.findIndex(t => t.id === id)
      if (idx !== -1) this.tasks[idx] = data
      return data
    },

    async deleteTask(id) {
      await apiClient.delete(`/tasks/${id}/`)
      this.tasks = this.tasks.filter(t => t.id !== id)
    },

    // --- COMMENTS ---
    async addComment(taskId, content) {
      const { data } = await apiClient.post('/comments/', { task: taskId, content })
      return data
    },

    // --- USERS ---
    async fetchUsers() {
      try {
        const { data } = await apiClient.get('/auth/users/')
        this.allUsers = data
      } catch (err) {
        console.error('Failed to load users', err)
      }
    }
  }
})
