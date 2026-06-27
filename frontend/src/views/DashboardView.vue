<template>
  <div class="dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Tableau de bord</h2>
        <p class="page-subtitle">Bienvenue, {{ authStore.user?.first_name || authStore.user?.username }} 👋</p>
      </div>
      <router-link to="/projects/new" class="btn btn-primary" id="dashboard-new-project-btn">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Nouveau projet
      </router-link>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.label">
        <div class="stat-icon" :style="{ background: stat.iconBg }">
          <span v-html="stat.icon"></span>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
        <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
          {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
        </div>
      </div>
    </div>

    <!-- Charts + Recent Projects Grid -->
    <div class="dashboard-grid">
      <!-- Task Status Chart -->
      <div class="card chart-card">
        <h3 class="card-title">Répartition des tâches</h3>
        <div class="chart-wrapper" v-if="!projectStore.loading">
          <Doughnut :data="taskChartData" :options="chartOptions" />
        </div>
        <div v-else class="page-loading"><div class="spinner"></div></div>
      </div>

      <!-- Recent Projects -->
      <div class="card recent-projects">
        <div class="card-header">
          <h3 class="card-title">Projets récents</h3>
          <router-link to="/projects" class="btn btn-ghost btn-sm">Voir tout</router-link>
        </div>
        <div v-if="projectStore.loading" class="page-loading"><div class="spinner"></div></div>
        <div v-else-if="!projectStore.projects.length" class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>Aucun projet</h3>
          <p>Créez votre premier projet</p>
          <router-link to="/projects" class="btn btn-primary btn-sm">Créer un projet</router-link>
        </div>
        <ul v-else class="project-list">
          <li v-for="project in recentProjects" :key="project.id" class="project-list-item">
            <router-link :to="`/projects/${project.id}`" class="project-list-link" :id="`dashboard-project-${project.id}`">
              <div class="project-color-dot" :style="{ background: getProjectColor(project.id) }"></div>
              <div class="project-list-info">
                <span class="project-list-title">{{ project.title }}</span>
                <span class="project-list-meta">Créé le {{ formatDate(project.created_at) }}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="arrow-icon"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- My Assigned Tasks -->
    <div class="card my-tasks-section">
      <div class="card-header">
        <h3 class="card-title">Mes tâches assignées</h3>
        <div class="task-filters">
          <button
            v-for="f in taskFilters" :key="f.value"
            class="filter-btn"
            :class="{ active: taskFilter === f.value }"
            @click="taskFilter = f.value"
          >{{ f.label }}</button>
        </div>
      </div>

      <div v-if="filteredMyTasks.length" class="task-table-wrapper">
        <table class="task-table" aria-label="Mes tâches assignées">
          <thead>
            <tr>
              <th>Tâche</th>
              <th>Projet</th>
              <th>Statut</th>
              <th>Échéance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in filteredMyTasks" :key="task.id" class="task-row">
              <td class="task-title-cell">{{ task.title }}</td>
              <td>
                <router-link :to="`/projects/${task.project}`" class="project-link">
                  {{ getProjectName(task.project) }}
                </router-link>
              </td>
              <td>
                <span :class="statusBadge(task.status)">{{ statusLabel(task.status) }}</span>
              </td>
              <td class="due-date" :class="{ overdue: isOverdue(task.due_date) }">
                {{ task.due_date ? formatDate(task.due_date) : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>Aucune tâche</h3>
        <p>Vous n'avez pas de tâches assignées dans cette catégorie</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/projects'

ChartJS.register(ArcElement, Tooltip, Legend)

const authStore = useAuthStore()
const projectStore = useProjectStore()

const taskFilter = ref('ALL')
const taskFilters = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'TODO', label: 'À faire' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DONE', label: 'Terminées' }
]

const projectColors = ['#6C63FF', '#00D9FF', '#00C896', '#FF9500', '#FF4D6A', '#B966E7']

function getProjectColor(id) {
  return projectColors[id % projectColors.length]
}

const recentProjects = computed(() => projectStore.projects.slice(0, 5))

// Collect all tasks from all projects for the current user
const allTasks = computed(() => projectStore.tasks)

const myTasks = computed(() =>
  allTasks.value.filter(t => t.assigned_to === authStore.user?.id)
)

const filteredMyTasks = computed(() => {
  if (taskFilter.value === 'ALL') return myTasks.value
  return myTasks.value.filter(t => t.status === taskFilter.value)
})

const stats = computed(() => [
  {
    label: 'Projets totaux',
    value: projectStore.projects.length,
    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 6a2 2 0 012-2h3.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0010.414 6H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" stroke="#6C63FF" stroke-width="1.5"/></svg>`,
    iconBg: 'rgba(108, 99, 255, 0.15)',
    trend: 12
  },
  {
    label: 'Tâches totales',
    value: allTasks.value.length,
    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 6h12M4 10h8M4 14h10" stroke="#00D9FF" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    iconBg: 'rgba(0, 217, 255, 0.1)',
    trend: 8
  },
  {
    label: 'Terminées',
    value: allTasks.value.filter(t => t.status === 'DONE').length,
    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10l4 4 6-8" stroke="#00C896" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    iconBg: 'rgba(0, 200, 150, 0.12)',
    trend: 24
  },
  {
    label: 'En cours',
    value: allTasks.value.filter(t => t.status === 'IN_PROGRESS').length,
    icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="#FF9500" stroke-width="1.5"/><path d="M10 6v4l3 2" stroke="#FF9500" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    iconBg: 'rgba(255, 149, 0, 0.12)',
    trend: -3
  }
])

const taskChartData = computed(() => ({
  labels: ['À faire', 'En cours', 'Terminées'],
  datasets: [{
    data: [
      allTasks.value.filter(t => t.status === 'TODO').length,
      allTasks.value.filter(t => t.status === 'IN_PROGRESS').length,
      allTasks.value.filter(t => t.status === 'DONE').length
    ],
    backgroundColor: ['rgba(108, 99, 255, 0.8)', 'rgba(255, 149, 0, 0.8)', 'rgba(0, 200, 150, 0.8)'],
    borderColor: ['#6C63FF', '#FF9500', '#00C896'],
    borderWidth: 2,
    hoverOffset: 8
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#8892B0', padding: 16, font: { size: 13 } }
    }
  }
}

function getProjectName(id) {
  return projectStore.projects.find(p => p.id === id)?.title || `Projet #${id}`
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function statusBadge(s) {
  return { badge: true, 'badge-todo': s === 'TODO', 'badge-progress': s === 'IN_PROGRESS', 'badge-done': s === 'DONE' }
}
function statusLabel(s) {
  return { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminé' }[s]
}
function isOverdue(d) {
  return d && new Date(d) < new Date()
}

onMounted(async () => {
  await projectStore.fetchProjects()
  // Fetch tasks from all projects for dashboard stats
  if (projectStore.projects.length) {
    for (const p of projectStore.projects.slice(0, 5)) {
      await projectStore.fetchTasks(p.id)
    }
  }
})
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: var(--space-xl); }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-md);
}
.page-title { font-size: 1.8rem; margin-bottom: 4px; }
.page-subtitle { color: var(--text-muted); font-size: 0.9rem; }

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}
.stat-card {
  background: var(--gradient-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  transition: all var(--transition-normal);
}
.stat-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: var(--shadow-md); }

.stat-icon {
  width: 48px; height: 48px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-content { flex: 1; }
.stat-value { display: block; font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
.stat-label { font-size: 0.8rem; color: var(--text-muted); }
.stat-trend { font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: var(--radius-full); }
.stat-trend.up { background: rgba(0, 200, 150, 0.12); color: var(--success); }
.stat-trend.down { background: rgba(255, 77, 106, 0.1); color: var(--danger); }

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: var(--space-xl);
}
.chart-card { display: flex; flex-direction: column; gap: var(--space-lg); }
.chart-wrapper { height: 260px; }
.card-title { font-size: 1.05rem; font-weight: 700; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md); }

/* Recent Projects */
.project-list { display: flex; flex-direction: column; gap: 4px; }
.project-list-item { border-radius: var(--radius-sm); overflow: hidden; }
.project-list-link {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  color: var(--text-primary);
}
.project-list-link:hover { background: rgba(255,255,255,0.04); }
.project-color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.project-list-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.project-list-title { font-size: 0.9rem; font-weight: 500; }
.project-list-meta { font-size: 0.75rem; color: var(--text-muted); }
.arrow-icon { color: var(--text-muted); opacity: 0; transition: opacity var(--transition-fast); }
.project-list-link:hover .arrow-icon { opacity: 1; }

/* Task Section */
.my-tasks-section { }
.task-filters { display: flex; gap: 4px; }
.filter-btn {
  padding: 5px 12px; border-radius: var(--radius-full);
  font-size: 0.8rem; font-weight: 500;
  color: var(--text-muted);
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  transition: all var(--transition-fast);
}
.filter-btn:hover { color: var(--text-primary); background: rgba(255,255,255,0.08); }
.filter-btn.active { background: rgba(108, 99, 255, 0.2); color: var(--primary-light); border-color: rgba(108, 99, 255, 0.3); }

.task-table-wrapper { overflow-x: auto; }
.task-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.task-table th {
  text-align: left; padding: 12px 16px;
  color: var(--text-muted); font-size: 0.75rem;
  font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
  border-bottom: 1px solid var(--border);
}
.task-row td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.task-row:hover td { background: rgba(255,255,255,0.02); }
.task-title-cell { font-weight: 500; color: var(--text-primary); }
.project-link { color: var(--primary-light); }
.due-date.overdue { color: var(--danger); }

/* Responsive */
@media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
</style>
