<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': !sidebarOpen }">
      <div class="sidebar-header">
        <div class="brand-logo">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path d="M4 8h24M4 16h16M4 24h20" stroke="url(#sg)" stroke-width="2.5" stroke-linecap="round"/>
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="32" y2="0">
                <stop offset="0%" stop-color="#6C63FF"/>
                <stop offset="100%" stop-color="#00D9FF"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span v-if="sidebarOpen" class="brand-text">CollabFlow</span>
        <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen" aria-label="Toggle sidebar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav" role="navigation" aria-label="Navigation principale">
        <router-link to="/dashboard" class="nav-item" active-class="active" id="nav-dashboard">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>
          </span>
          <span v-if="sidebarOpen" class="nav-label">Tableau de bord</span>
        </router-link>

        <router-link to="/projects" class="nav-item" active-class="active" id="nav-projects">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 6a2 2 0 012-2h3.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0010.414 6H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" stroke="currentColor" stroke-width="1.5"/></svg>
          </span>
          <span v-if="sidebarOpen" class="nav-label">Projets</span>
        </router-link>

        <router-link to="/profile" class="nav-item" active-class="active" id="nav-profile">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <span v-if="sidebarOpen" class="nav-label">Profil</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div v-if="sidebarOpen" class="user-info">
          <div class="avatar">{{ userInitials }}</div>
          <div class="user-details">
            <span class="user-name">{{ authStore.user?.first_name || authStore.user?.username }}</span>
            <span :class="['badge', authStore.isAdmin ? 'badge-admin' : 'badge-member']">
              {{ authStore.isAdmin ? 'Admin' : 'Membre' }}
            </span>
          </div>
        </div>
        <button class="btn-icon logout-btn" @click="handleLogout" id="logout-btn" :title="sidebarOpen ? '' : 'Déconnexion'">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.75 15.75H3.75A1.5 1.5 0 012.25 14.25V3.75A1.5 1.5 0 013.75 2.25H6.75M12 12.75L15.75 9M15.75 9L12 5.25M15.75 9H6.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Top Bar -->
      <header class="topbar">
        <button class="btn-icon mobile-menu-btn" @click="sidebarOpen = !sidebarOpen" aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <div class="topbar-right">
          <div class="notification-bell">
            <button class="btn-icon" aria-label="Notifications" id="notifications-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 00-6 6v2.586l-1.293 1.293A1 1 0 003 13.586V15a1 1 0 001 1h3.586a2 2 0 003.828 0H15a1 1 0 001-1v-1.414a1 1 0 00-.293-.707L14.414 10.586V8a6 6 0 00-4.414-5.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="avatar avatar-sm">{{ userInitials }}</div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <router-view />
      </main>
    </div>

    <!-- Mobile Overlay -->
    <Transition name="fade">
      <div v-if="sidebarOpen && isMobile" class="mobile-overlay" @click="sidebarOpen = false"></div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()
const sidebarOpen = ref(true)
const isMobile = ref(false)

const userInitials = computed(() => {
  const u = authStore.user
  if (!u) return '?'
  if (u.first_name && u.last_name) return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase()
  return u.username?.[0]?.toUpperCase() || '?'
})

function handleLogout() {
  authStore.logout()
  toast.info('Vous avez été déconnecté.')
  router.push('/login')
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) sidebarOpen.value = false
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => window.removeEventListener('resize', checkMobile))
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* --- Sidebar --- */
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #0F1124 0%, #0D0E1A 100%);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 100;
  transition: width var(--transition-normal);
  overflow: hidden;
}
.sidebar-collapsed { width: 72px; }

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px;
  border-bottom: 1px solid var(--border);
  min-height: 70px;
}
.brand-logo {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, rgba(108, 99, 255, 0.2), rgba(0, 217, 255, 0.1));
  border: 1px solid rgba(108, 99, 255, 0.3);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.brand-text {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #6C63FF, #00D9FF);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  white-space: nowrap;
  flex: 1;
}
.sidebar-toggle {
  color: var(--text-muted);
  padding: 4px;
  border-radius: 6px;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}
.sidebar-toggle:hover { color: var(--text-primary); background: rgba(255,255,255,0.05); }
.sidebar-collapsed .sidebar-toggle svg { transform: rotate(180deg); }

.sidebar-nav {
  flex: 1;
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}
.nav-item.active {
  background: linear-gradient(135deg, rgba(108, 99, 255, 0.2), rgba(0, 217, 255, 0.05));
  color: var(--primary-light);
  border: 1px solid rgba(108, 99, 255, 0.2);
}
.nav-icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

.sidebar-footer {
  padding: 16px 10px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}
.user-details { display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
.user-name { font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.logout-btn { color: var(--text-muted); flex-shrink: 0; }
.logout-btn:hover { color: var(--danger); background: var(--danger-light); border-color: rgba(255, 77, 106, 0.3); }

/* --- Main Content --- */
.main-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left var(--transition-normal);
}
.sidebar-collapsed ~ .main-content { margin-left: 72px; }

/* Topbar */
.topbar {
  height: 70px;
  background: rgba(13, 14, 26, 0.9);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.topbar-right { display: flex; align-items: center; gap: 12px; }
.mobile-menu-btn { display: none; }

.page-content {
  flex: 1;
  padding: 32px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

/* Mobile overlay */
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 99;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 200;
    transform: translateX(-100%);
    width: 260px;
  }
  .sidebar.sidebar-open { transform: translateX(0); }
  .sidebar-collapsed { transform: translateX(-100%); }
  .main-content { margin-left: 0 !important; }
  .mobile-menu-btn { display: flex; }
  .mobile-overlay { display: block; }
  .page-content { padding: 20px 16px; }
  .topbar { padding: 0 16px; }
}
</style>
