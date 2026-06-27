import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy-load route components
const LoginView = () => import('@/views/auth/LoginView.vue')
const RegisterView = () => import('@/views/auth/RegisterView.vue')
const AppLayout = () => import('@/layouts/AppLayout.vue')
const DashboardView = () => import('@/views/DashboardView.vue')
const ProjectsView = () => import('@/views/projects/ProjectsView.vue')
const ProjectDetailView = () => import('@/views/projects/ProjectDetailView.vue')
const ProfileView = () => import('@/views/ProfileView.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView
      },
      {
        path: 'projects',
        name: 'Projects',
        component: ProjectsView
      },
      {
        path: 'projects/:id',
        name: 'ProjectDetail',
        component: ProjectDetailView
      },
      {
        path: 'profile',
        name: 'Profile',
        component: ProfileView
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
