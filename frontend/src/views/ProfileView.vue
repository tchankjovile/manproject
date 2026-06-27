<template>
  <div class="profile-page">
    <div class="page-header">
      <h2 class="page-title">Mon profil</h2>
    </div>

    <div class="profile-grid">
      <!-- Profile Card -->
      <div class="card profile-card">
        <div class="profile-avatar-section">
          <div class="avatar avatar-xl" style="width:80px;height:80px;font-size:2rem">{{ userInitials }}</div>
          <div>
            <h3 class="profile-name">{{ form.first_name || authStore.user?.username }} {{ form.last_name }}</h3>
            <span :class="['badge', authStore.isAdmin ? 'badge-admin' : 'badge-member']">
              {{ authStore.isAdmin ? 'Administrateur' : 'Membre' }}
            </span>
          </div>
        </div>

        <div class="profile-stats">
          <div class="profile-stat">
            <span class="stat-val">{{ projectStore.projects.length }}</span>
            <span class="stat-lbl">Projets</span>
          </div>
          <div class="profile-stat">
            <span class="stat-val">{{ myTasks }}</span>
            <span class="stat-lbl">Tâches</span>
          </div>
          <div class="profile-stat">
            <span class="stat-val">{{ doneTasks }}</span>
            <span class="stat-lbl">Terminées</span>
          </div>
        </div>
      </div>

      <!-- Edit Form -->
      <div class="card edit-form-card">
        <h3 class="card-section-title">Informations personnelles</h3>
        <Transition name="fade">
          <div v-if="saved" class="success-banner">✅ Profil mis à jour avec succès !</div>
        </Transition>
        <form @submit.prevent="handleSave" style="display:flex;flex-direction:column;gap:18px" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="prof-first">Prénom</label>
              <input id="prof-first" v-model="form.first_name" type="text" class="form-input" placeholder="Prénom" />
            </div>
            <div class="form-group">
              <label class="form-label" for="prof-last">Nom</label>
              <input id="prof-last" v-model="form.last_name" type="text" class="form-input" placeholder="Nom" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="prof-email">Email</label>
            <input id="prof-email" v-model="form.email" type="email" class="form-input" placeholder="email@exemple.com" />
          </div>
          <div class="form-group">
            <label class="form-label" for="prof-username">Nom d'utilisateur</label>
            <input id="prof-username" v-model="form.username" type="text" class="form-input" />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="saving" id="save-profile-btn">
            <span v-if="saving" class="spinner spinner-sm"></span>
            {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/projects'
import apiClient from '@/api/client'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const projectStore = useProjectStore()
const toast = useToast()
const saving = ref(false)
const saved = ref(false)

const form = reactive({
  first_name: authStore.user?.first_name || '',
  last_name: authStore.user?.last_name || '',
  email: authStore.user?.email || '',
  username: authStore.user?.username || ''
})

const userInitials = computed(() => {
  if (form.first_name && form.last_name) return `${form.first_name[0]}${form.last_name[0]}`.toUpperCase()
  return form.username?.[0]?.toUpperCase() || '?'
})

const myTasks = computed(() => projectStore.tasks.filter(t => t.assigned_to === authStore.user?.id).length)
const doneTasks = computed(() => projectStore.tasks.filter(t => t.assigned_to === authStore.user?.id && t.status === 'DONE').length)

async function handleSave() {
  saving.value = true
  try {
    const { data } = await apiClient.patch('/auth/profile/', {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      username: form.username
    })
    authStore.user = data
    localStorage.setItem('user', JSON.stringify(data))
    saved.value = true
    toast.success('Profil mis à jour !')
    setTimeout(() => (saved.value = false), 3000)
  } catch (e) {
    toast.error('Erreur lors de la mise à jour')
  } finally {
    saving.value = false
  }
}

onMounted(() => projectStore.fetchProjects())
</script>

<style scoped>
.profile-page { display: flex; flex-direction: column; gap: var(--space-xl); }
.page-title { font-size: 1.8rem; }

.profile-grid { display: grid; grid-template-columns: 300px 1fr; gap: var(--space-xl); align-items: start; }

.profile-card { display: flex; flex-direction: column; gap: var(--space-xl); }
.profile-avatar-section { display: flex; flex-direction: column; align-items: center; gap: var(--space-md); text-align: center; }
.profile-name { font-size: 1.2rem; font-weight: 700; }

.profile-stats { display: flex; border-top: 1px solid var(--border); padding-top: var(--space-xl); }
.profile-stat { flex: 1; text-align: center; }
.profile-stat + .profile-stat { border-left: 1px solid var(--border); }
.stat-val { display: block; font-size: 1.8rem; font-weight: 800; color: var(--text-primary); }
.stat-lbl { font-size: 0.75rem; color: var(--text-muted); }

.card-section-title { font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-lg); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.success-banner {
  background: rgba(0,200,150,0.1); border: 1px solid rgba(0,200,150,0.3);
  color: var(--success); padding: 12px 16px; border-radius: 10px;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .profile-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
