<template>
  <div class="project-detail">
    <div v-if="projectStore.loading && !projectStore.currentProject" class="page-loading" style="min-height:400px">
      <div class="spinner"></div>
    </div>

    <template v-else-if="projectStore.currentProject">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <router-link to="/projects" class="back-link">← Projets</router-link>
          <h2 class="page-title">{{ projectStore.currentProject.title }}</h2>
          <p v-if="projectStore.currentProject.description" class="page-subtitle">{{ projectStore.currentProject.description }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost btn-sm" @click="showTaskModal = true" id="add-task-btn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Ajouter une tâche
          </button>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="kanban-board">
        <div v-for="col in columns" :key="col.status" class="kanban-col">
          <div class="kanban-col-header">
            <span class="col-dot" :style="{ background: col.color }"></span>
            <h4 class="col-title">{{ col.label }}</h4>
            <span class="col-count">{{ getColumnTasks(col.status).length }}</span>
          </div>

          <draggable
            :list="getColumnTasksRef(col.status)"
            group="tasks"
            item-key="id"
            class="kanban-list"
            ghost-class="task-ghost"
            @end="(evt) => onDragEnd(evt, col.status)"
          >
            <template #item="{ element: task }">
              <div class="task-card" :id="`task-${task.id}`" @click="openTaskDetail(task)">
                <div class="task-card-top">
                  <span :class="statusBadge(task.status)">{{ statusLabel(task.status) }}</span>
                  <div class="task-card-actions" @click.stop>
                    <button class="btn-icon" style="padding:4px" @click="openEditTask(task)" :id="`edit-task-${task.id}`" title="Modifier">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2V9L9 2z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                    </button>
                    <button class="btn-icon" style="padding:4px; color: var(--danger)" @click="handleDeleteTask(task)" :id="`delete-task-${task.id}`" title="Supprimer">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 3.5h8M5 3.5V2.5h3v1M4 3.5v7h5v-7H4z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                    </button>
                  </div>
                </div>
                <h5 class="task-title">{{ task.title }}</h5>
                <p v-if="task.description" class="task-desc">{{ task.description }}</p>
                <div class="task-card-footer">
                  <div v-if="task.assigned_to" class="task-assignee">
                    <div class="avatar avatar-sm">{{ getUserInitials(task.assigned_to) }}</div>
                    <span class="assignee-name">{{ getUserName(task.assigned_to) }}</span>
                  </div>
                  <div v-if="task.due_date" class="task-due" :class="{ overdue: isOverdue(task.due_date) }">
                    📅 {{ formatDate(task.due_date) }}
                  </div>
                </div>
                <div v-if="task.comments?.length" class="task-comments-count">
                  💬 {{ task.comments.length }} commentaire(s)
                </div>
              </div>
            </template>
            <template #footer>
              <div class="kanban-add" @click="addTaskInColumn(col.status)">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Ajouter
              </div>
            </template>
          </draggable>
        </div>
      </div>

      <!-- Task Create/Edit Modal -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showTaskModal" class="modal-overlay" @click.self="closeTaskModal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
            <div class="modal-box" @click.stop>
              <div class="modal-header">
                <h3 id="task-modal-title">{{ editingTask ? 'Modifier la tâche' : 'Nouvelle tâche' }}</h3>
                <button class="btn-icon" @click="closeTaskModal" aria-label="Fermer">✕</button>
              </div>
              <form @submit.prevent="handleTaskSubmit" class="modal-body" style="display:flex;flex-direction:column;gap:18px" novalidate>
                <div class="form-group">
                  <label class="form-label" for="task-title">Titre *</label>
                  <input id="task-title" v-model="taskForm.title" type="text" class="form-input" :class="{error: taskError}" placeholder="Titre de la tâche" />
                  <span v-if="taskError" class="field-error">{{ taskError }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="task-desc">Description</label>
                  <textarea id="task-desc" v-model="taskForm.description" class="form-input" rows="3" placeholder="Détails..."></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="task-status">Statut</label>
                    <select id="task-status" v-model="taskForm.status" class="form-input">
                      <option value="TODO">À faire</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="DONE">Terminé</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="task-due">Échéance</label>
                    <input id="task-due" v-model="taskForm.due_date" type="date" class="form-input" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="task-assign">Assigner à</label>
                  <select id="task-assign" v-model="taskForm.assigned_to" class="form-input">
                    <option :value="null">-- Non assigné --</option>
                    <option v-for="u in projectStore.allUsers" :key="u.id" :value="u.id">
                      {{ u.first_name || u.username }}
                    </option>
                  </select>
                </div>
                <div class="modal-footer" style="padding:0; margin-top:8px">
                  <button type="button" class="btn btn-ghost" @click="closeTaskModal">Annuler</button>
                  <button type="submit" class="btn btn-primary" :disabled="savingTask" id="task-form-submit">
                    <span v-if="savingTask" class="spinner spinner-sm"></span>
                    {{ editingTask ? 'Mettre à jour' : 'Créer la tâche' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Task Detail Drawer -->
      <Teleport to="body">
        <Transition name="slide-right">
          <div v-if="detailTask" class="task-drawer-overlay" @click.self="detailTask = null">
            <div class="task-drawer">
              <div class="drawer-header">
                <h3>{{ detailTask.title }}</h3>
                <button class="btn-icon" @click="detailTask = null" aria-label="Fermer">✕</button>
              </div>
              <div class="drawer-body">
                <div class="drawer-meta">
                  <span :class="statusBadge(detailTask.status)">{{ statusLabel(detailTask.status) }}</span>
                  <span v-if="detailTask.due_date" class="task-due" :class="{overdue: isOverdue(detailTask.due_date)}">
                    📅 {{ formatDate(detailTask.due_date) }}
                  </span>
                </div>
                <p v-if="detailTask.description" class="drawer-desc">{{ detailTask.description }}</p>

                <div class="comments-section">
                  <h4 class="section-title">Commentaires</h4>
                  <div v-if="!detailTask.comments?.length" class="empty-state" style="padding: 24px;">
                    <p>Aucun commentaire.</p>
                  </div>
                  <div v-else class="comments-list">
                    <div v-for="c in detailTask.comments" :key="c.id" class="comment-item">
                      <div class="avatar avatar-sm">{{ c.author?.first_name?.[0] || c.author?.username?.[0] || '?' }}</div>
                      <div class="comment-content">
                        <span class="comment-author">{{ c.author?.first_name || c.author?.username }}</span>
                        <p class="comment-text">{{ c.content }}</p>
                        <span class="comment-date">{{ formatDate(c.created_at) }}</span>
                      </div>
                    </div>
                  </div>
                  <form @submit.prevent="submitComment" class="comment-form">
                    <textarea v-model="newComment" class="form-input" rows="2" placeholder="Écrire un commentaire..." id="comment-input"></textarea>
                    <button type="submit" class="btn btn-primary btn-sm" :disabled="!newComment.trim()" id="submit-comment-btn">Envoyer</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>

    <div v-else class="empty-state" style="min-height:400px">
      <div class="empty-icon">😕</div>
      <h3>Projet introuvable</h3>
      <router-link to="/projects" class="btn btn-primary btn-sm">Retour aux projets</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import { useProjectStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const route = useRoute()
const projectStore = useProjectStore()
const authStore = useAuthStore()
const toast = useToast()

const showTaskModal = ref(false)
const editingTask = ref(null)
const detailTask = ref(null)
const savingTask = ref(false)
const taskError = ref('')
const newComment = ref('')
const taskForm = reactive({ title: '', description: '', status: 'TODO', due_date: '', assigned_to: null })

const columns = [
  { status: 'TODO', label: 'À faire', color: '#6C63FF' },
  { status: 'IN_PROGRESS', label: 'En cours', color: '#FF9500' },
  { status: 'DONE', label: 'Terminé', color: '#00C896' }
]

function getColumnTasks(status) {
  return projectStore.tasks.filter(t => t.status === status)
}
function getColumnTasksRef(status) {
  return projectStore.tasks.filter(t => t.status === status)
}

function getUserInitials(userId) {
  const u = projectStore.allUsers.find(u => u.id === userId)
  if (!u) return '?'
  if (u.first_name && u.last_name) return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase()
  return u.username?.[0]?.toUpperCase() || '?'
}
function getUserName(userId) {
  const u = projectStore.allUsers.find(u => u.id === userId)
  return u ? (u.first_name || u.username) : `#${userId}`
}
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function statusBadge(s) {
  return { badge: true, 'badge-todo': s === 'TODO', 'badge-progress': s === 'IN_PROGRESS', 'badge-done': s === 'DONE' }
}
function statusLabel(s) {
  return { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminé' }[s]
}
function isOverdue(d) { return d && new Date(d) < new Date() }

async function onDragEnd(evt, newStatus) {
  const task = projectStore.tasks[evt.newIndex]
  if (task && task.status !== newStatus) {
    await projectStore.updateTask(task.id, { status: newStatus })
    toast.success(`Tâche déplacée vers "${statusLabel(newStatus)}"`)
  }
}

function addTaskInColumn(status) {
  taskForm.status = status
  showTaskModal.value = true
}
function openEditTask(task) {
  editingTask.value = task
  Object.assign(taskForm, { title: task.title, description: task.description || '', status: task.status, due_date: task.due_date || '', assigned_to: task.assigned_to })
  showTaskModal.value = true
}
function openTaskDetail(task) { detailTask.value = task }
function closeTaskModal() {
  showTaskModal.value = false
  editingTask.value = null
  taskError.value = ''
  Object.assign(taskForm, { title: '', description: '', status: 'TODO', due_date: '', assigned_to: null })
}

async function handleTaskSubmit() {
  taskError.value = ''
  if (!taskForm.title.trim()) { taskError.value = 'Le titre est requis'; return }
  savingTask.value = true
  try {
    const payload = { ...taskForm, project: route.params.id }
    if (editingTask.value) {
      await projectStore.updateTask(editingTask.value.id, payload)
      toast.success('Tâche mise à jour !')
    } else {
      await projectStore.createTask(payload)
      toast.success('Tâche créée !')
    }
    closeTaskModal()
  } catch (e) {
    toast.error('Erreur lors de la sauvegarde')
  } finally {
    savingTask.value = false
  }
}

async function handleDeleteTask(task) {
  if (!confirm(`Supprimer la tâche "${task.title}" ?`)) return
  await projectStore.deleteTask(task.id)
  toast.success('Tâche supprimée.')
}

async function submitComment() {
  if (!newComment.value.trim() || !detailTask.value) return
  const comment = await projectStore.addComment(detailTask.value.id, newComment.value)
  if (!detailTask.value.comments) detailTask.value.comments = []
  detailTask.value.comments.unshift(comment)
  newComment.value = ''
  toast.success('Commentaire ajouté !')
}

onMounted(async () => {
  const id = route.params.id
  await projectStore.fetchProject(id)
  await projectStore.fetchTasks(id)
  await projectStore.fetchUsers()
})
</script>

<style scoped>
.project-detail { display: flex; flex-direction: column; gap: var(--space-xl); }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: var(--space-md); }
.header-left { display: flex; flex-direction: column; gap: 6px; }
.back-link { font-size: 0.85rem; color: var(--text-muted); transition: color var(--transition-fast); }
.back-link:hover { color: var(--primary-light); }
.page-title { font-size: 1.8rem; }
.page-subtitle { color: var(--text-muted); font-size: 0.9rem; }

/* Kanban */
.kanban-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-lg); align-items: start; }
.kanban-col {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}
.kanban-col-header {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.col-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.col-title { font-size: 0.9rem; font-weight: 600; flex: 1; }
.col-count {
  background: rgba(255,255,255,0.07);
  color: var(--text-muted);
  padding: 2px 8px; border-radius: var(--radius-full);
  font-size: 0.75rem; font-weight: 600;
}

.kanban-list { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 10px; min-height: 100px; }

.task-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  cursor: grab;
  transition: all var(--transition-fast);
  display: flex; flex-direction: column; gap: 8px;
}
.task-card:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); }
.task-card:active { cursor: grabbing; }
.task-ghost { opacity: 0.3; border: 2px dashed var(--primary); background: rgba(108,99,255,0.05); }

.task-card-top { display: flex; align-items: center; justify-content: space-between; }
.task-card-actions { display: flex; gap: 2px; opacity: 0; transition: opacity var(--transition-fast); }
.task-card:hover .task-card-actions { opacity: 1; }
.task-title { font-size: 0.9rem; font-weight: 600; line-height: 1.4; }
.task-desc { font-size: 0.8rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.task-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.task-assignee { display: flex; align-items: center; gap: 6px; }
.assignee-name { font-size: 0.75rem; color: var(--text-muted); }
.task-due { font-size: 0.75rem; color: var(--text-muted); }
.task-due.overdue { color: var(--danger); }
.task-comments-count { font-size: 0.75rem; color: var(--text-muted); }

.kanban-add {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  color: var(--text-muted); font-size: 0.85rem;
  cursor: pointer; transition: all var(--transition-fast);
  border: 1px dashed var(--border);
}
.kanban-add:hover { color: var(--primary-light); border-color: var(--primary); background: rgba(108,99,255,0.05); }

/* Drawer */
.task-drawer-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px); z-index: 1000;
  display: flex; justify-content: flex-end;
}
.task-drawer {
  width: 420px; max-width: 100%;
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  height: 100vh; overflow-y: auto;
  display: flex; flex-direction: column;
  animation: slideInRight 0.3s ease;
}
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-xl);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; background: var(--bg-card); z-index: 1;
}
.drawer-body { padding: var(--space-xl); display: flex; flex-direction: column; gap: var(--space-lg); }
.drawer-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.drawer-desc { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; }
.section-title { font-size: 1rem; font-weight: 600; margin-bottom: 12px; }

/* Comments */
.comments-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.comment-item { display: flex; gap: 10px; }
.comment-content { flex: 1; }
.comment-author { font-size: 0.8rem; font-weight: 600; }
.comment-text { font-size: 0.875rem; color: var(--text-secondary); margin: 2px 0; }
.comment-date { font-size: 0.75rem; color: var(--text-muted); }
.comment-form { display: flex; flex-direction: column; gap: 10px; }

/* Form row */
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field-error { font-size: 0.8rem; color: var(--danger); }

/* Slide transition for drawer */
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s ease; }
.slide-right-enter-from .task-drawer, .slide-right-leave-to .task-drawer { transform: translateX(100%); }

@media (max-width: 900px) { .kanban-board { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .task-drawer { width: 100%; } }
</style>
