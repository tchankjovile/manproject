<template>
  <div class="projects-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Projets</h2>
        <p class="page-subtitle">{{ projectStore.projects.length }} projet(s) au total</p>
      </div>
      <button class="btn btn-primary" @click="showCreateModal = true" id="create-project-btn">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Nouveau projet
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="toolbar">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <input
          v-model="projectStore.searchQuery"
          type="text"
          class="search-input"
          placeholder="Rechercher un projet..."
          aria-label="Rechercher un projet"
          id="project-search-input"
        />
        <button v-if="projectStore.searchQuery" class="search-clear" @click="projectStore.searchQuery = ''" aria-label="Effacer">✕</button>
      </div>
      <div class="sort-controls">
        <select v-model="sortKey" class="form-input" style="width: auto" aria-label="Trier par">
          <option value="created_at">Plus récents</option>
          <option value="title">Alphabétique</option>
        </select>
      </div>
    </div>

    <!-- Projects Grid -->
    <div v-if="projectStore.loading" class="page-loading" style="min-height: 300px;">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!sortedProjects.length" class="empty-state">
      <div class="empty-icon">📂</div>
      <h3>{{ projectStore.searchQuery ? 'Aucun résultat' : 'Aucun projet' }}</h3>
      <p>{{ projectStore.searchQuery ? `Aucun projet ne correspond à "${projectStore.searchQuery}"` : 'Créez votre premier projet collaboratif' }}</p>
      <button v-if="!projectStore.searchQuery" class="btn btn-primary" @click="showCreateModal = true">Créer un projet</button>
    </div>

    <div v-else class="projects-grid">
      <div
        v-for="project in paginatedProjects"
        :key="project.id"
        class="project-card"
        :id="`project-card-${project.id}`"
      >
        <div class="project-card-color" :style="{ background: getProjectColor(project.id) }"></div>
        <div class="project-card-body">
          <div class="project-card-header">
            <h3 class="project-card-title">{{ project.title }}</h3>
            <div class="project-actions" v-if="canEdit(project)">
              <button class="btn-icon" @click="openEditModal(project)" :id="`edit-project-${project.id}`" title="Modifier" aria-label="Modifier le projet">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M10.5 2.5l2 2L5 12H3v-2l7.5-7.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <button class="btn-icon" @click="confirmDelete(project)" :id="`delete-project-${project.id}`" title="Supprimer" aria-label="Supprimer le projet" style="color: var(--danger)">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 4h9M6 4V3h3v1M5 4v8h5V4H5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
          <p class="project-description">{{ project.description || 'Aucune description' }}</p>
          <div class="project-card-footer">
            <div class="creator-info">
              <div class="avatar avatar-sm">{{ creatorInitials(project) }}</div>
              <span class="creator-name">{{ project.creator?.first_name || project.creator?.username }}</span>
            </div>
            <span class="project-date">{{ formatDate(project.created_at) }}</span>
          </div>
          <router-link :to="`/projects/${project.id}`" class="project-card-link" :aria-label="`Voir le projet ${project.title}`">Voir le projet →</router-link>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="btn btn-ghost btn-sm" :disabled="currentPage === 1" @click="currentPage--" id="pagination-prev">← Précédent</button>
      <span class="pagination-info">Page {{ currentPage }} / {{ totalPages }}</span>
      <button class="btn btn-ghost btn-sm" :disabled="currentPage === totalPages" @click="currentPage++" id="pagination-next">Suivant →</button>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModals" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
          <div class="modal-box" @click.stop>
            <div class="modal-header">
              <h3 id="project-modal-title">{{ showEditModal ? 'Modifier le projet' : 'Nouveau projet' }}</h3>
              <button class="btn-icon" @click="closeModals" aria-label="Fermer">✕</button>
            </div>
            <form @submit.prevent="handleSubmit" class="modal-body" novalidate>
              <div class="form-group">
                <label class="form-label" for="proj-title">Titre du projet *</label>
                <input id="proj-title" v-model="form.title" type="text" class="form-input" :class="{ error: formError }" placeholder="Mon super projet" required />
                <span v-if="formError" class="field-error">{{ formError }}</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="proj-desc">Description</label>
                <textarea id="proj-desc" v-model="form.description" class="form-input" rows="4" placeholder="Décrivez votre projet..."></textarea>
              </div>
              <div class="modal-footer" style="padding: 0; margin-top: 24px;">
                <button type="button" class="btn btn-ghost" @click="closeModals">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="saving" id="project-form-submit">
                  <span v-if="saving" class="spinner spinner-sm"></span>
                  {{ showEditModal ? 'Mettre à jour' : 'Créer le projet' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null" role="alertdialog">
          <div class="modal-box" style="max-width: 420px;" @click.stop>
            <div class="modal-body" style="text-align: center;">
              <div class="delete-icon">🗑️</div>
              <h3 style="margin: 16px 0 8px;">Supprimer le projet ?</h3>
              <p style="margin-bottom: 24px;">Cette action est irréversible. Le projet "<strong>{{ deleteTarget?.title }}</strong>" et toutes ses tâches seront supprimés.</p>
              <div class="flex gap-sm justify-center">
                <button class="btn btn-ghost" @click="deleteTarget = null">Annuler</button>
                <button class="btn btn-danger" @click="handleDelete" :disabled="saving" id="confirm-delete-btn">
                  <span v-if="saving" class="spinner spinner-sm"></span>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useProjectStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const projectStore = useProjectStore()
const authStore = useAuthStore()
const toast = useToast()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const deleteTarget = ref(null)
const saving = ref(false)
const formError = ref('')
const sortKey = ref('created_at')
const currentPage = ref(1)
const perPage = 9
const editTarget = ref(null)
const form = reactive({ title: '', description: '' })

const projectColors = ['linear-gradient(135deg, #6C63FF, #8B85FF)', 'linear-gradient(135deg, #00D9FF, #00A8B5)', 'linear-gradient(135deg, #00C896, #00A888)', 'linear-gradient(135deg, #FF9500, #FF6B6B)', 'linear-gradient(135deg, #FF4D6A, #FF6B9D)', 'linear-gradient(135deg, #B966E7, #6C63FF)']

function getProjectColor(id) { return projectColors[id % projectColors.length] }
function creatorInitials(p) {
  const u = p.creator
  if (!u) return '?'
  if (u.first_name && u.last_name) return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase()
  return u.username?.[0]?.toUpperCase() || '?'
}
function formatDate(d) { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
function canEdit(p) { return authStore.isAdmin || p.creator?.id === authStore.user?.id }

const sortedProjects = computed(() => {
  const arr = [...projectStore.filteredProjects]
  if (sortKey.value === 'title') arr.sort((a, b) => a.title.localeCompare(b.title))
  return arr
})

const totalPages = computed(() => Math.ceil(sortedProjects.value.length / perPage))
const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return sortedProjects.value.slice(start, start + perPage)
})

function openEditModal(project) {
  editTarget.value = project
  form.title = project.title
  form.description = project.description
  showEditModal.value = true
}
function closeModals() {
  showCreateModal.value = false
  showEditModal.value = false
  editTarget.value = null
  form.title = ''
  form.description = ''
  formError.value = ''
}
function confirmDelete(p) { deleteTarget.value = p }

async function handleSubmit() {
  formError.value = ''
  if (!form.title.trim()) { formError.value = 'Le titre est requis'; return }
  saving.value = true
  try {
    if (showEditModal.value) {
      await projectStore.updateProject(editTarget.value.id, { title: form.title, description: form.description })
      toast.success('Projet mis à jour !')
    } else {
      await projectStore.createProject({ title: form.title, description: form.description })
      toast.success('Projet créé avec succès !')
    }
    closeModals()
  } catch (e) {
    toast.error('Une erreur s\'est produite')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  saving.value = true
  try {
    await projectStore.deleteProject(deleteTarget.value.id)
    toast.success('Projet supprimé.')
    deleteTarget.value = null
  } catch (e) {
    toast.error('Erreur lors de la suppression')
  } finally {
    saving.value = false
  }
}

onMounted(() => projectStore.fetchProjects())
</script>

<style scoped>
.projects-page { display: flex; flex-direction: column; gap: var(--space-xl); }

.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-md); }
.page-title { font-size: 1.8rem; margin-bottom: 4px; }
.page-subtitle { color: var(--text-muted); font-size: 0.9rem; }

/* Toolbar */
.toolbar { display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap; }
.search-box {
  position: relative;
  flex: 1;
  min-width: 240px;
}
.search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--text-muted); pointer-events: none;
}
.search-input {
  width: 100%; padding: 10px 16px 10px 42px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary); font-size: 0.9rem;
  transition: all var(--transition-fast); outline: none;
}
.search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.search-input::placeholder { color: var(--text-muted); }
.search-clear {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: var(--text-muted); font-size: 0.8rem;
  cursor: pointer;
}

/* Projects Grid */
.projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: var(--space-lg); }
.project-card {
  background: var(--gradient-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
}
.project-card:hover { border-color: var(--border-hover); transform: translateY(-4px); box-shadow: var(--shadow-md), 0 0 0 1px rgba(108,99,255,0.1); }
.project-card-color { height: 5px; flex-shrink: 0; }
.project-card-body { padding: var(--space-xl); display: flex; flex-direction: column; gap: 12px; flex: 1; }
.project-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.project-card-title { font-size: 1.05rem; font-weight: 700; line-height: 1.3; flex: 1; }
.project-actions { display: flex; gap: 4px; opacity: 0; transition: opacity var(--transition-fast); }
.project-card:hover .project-actions { opacity: 1; }
.project-description { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.project-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border); }
.creator-info { display: flex; align-items: center; gap: 8px; }
.creator-name { font-size: 0.8rem; color: var(--text-secondary); }
.project-date { font-size: 0.75rem; color: var(--text-muted); }
.project-card-link {
  display: inline-block; margin-top: 8px;
  font-size: 0.85rem; font-weight: 600;
  color: var(--primary-light);
  transition: all var(--transition-fast);
}
.project-card-link:hover { color: var(--accent); letter-spacing: 0.5px; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-lg); }
.pagination-info { font-size: 0.875rem; color: var(--text-muted); }

/* Delete icon */
.delete-icon { font-size: 3rem; }
.field-error { font-size: 0.8rem; color: var(--danger); }

@media (max-width: 600px) {
  .projects-grid { grid-template-columns: 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; }
}
</style>
