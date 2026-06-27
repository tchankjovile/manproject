<template>
  <div class="auth-layout">
    <!-- Animated Background Orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <!-- Auth Card -->
    <div class="auth-container">
      <!-- Logo & Brand -->
      <div class="auth-brand">
        <div class="brand-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 8h24M4 16h16M4 24h20" stroke="url(#g)" stroke-width="2.5" stroke-linecap="round"/>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="32" y2="0">
                <stop offset="0%" stop-color="#6C63FF"/>
                <stop offset="100%" stop-color="#00D9FF"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h1 class="brand-name">CollabFlow</h1>
          <p class="brand-tagline">Gestion de projets collaboratifs</p>
        </div>
      </div>

      <!-- Error Banner -->
      <Transition name="fade">
        <div v-if="authStore.error" class="error-banner" role="alert">
          <span>⚠️</span>
          <span>{{ typeof authStore.error === 'string' ? authStore.error : 'Vérifiez vos informations' }}</span>
        </div>
      </Transition>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="auth-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="username">Nom d'utilisateur</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-input"
            :class="{ error: errors.username }"
            placeholder="Votre nom d'utilisateur"
            autocomplete="username"
            required
          />
          <span v-if="errors.username" class="field-error">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Mot de passe</label>
          <div class="input-group">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ error: errors.password }"
              placeholder="Votre mot de passe"
              autocomplete="current-password"
              required
            />
            <button type="button" class="input-eye" @click="showPassword = !showPassword" aria-label="Toggle password">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-lg w-full"
          :disabled="authStore.loading"
          id="login-submit-btn"
        >
          <span v-if="authStore.loading" class="spinner spinner-sm"></span>
          <span>{{ authStore.loading ? 'Connexion...' : 'Se connecter' }}</span>
        </button>
      </form>

      <div class="divider">ou</div>

      <p class="auth-redirect">
        Pas encore de compte ?
        <router-link to="/register" class="auth-link">Créer un compte</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const showPassword = ref(false)
const form = reactive({ username: '', password: '' })
const errors = reactive({ username: '', password: '' })

function validate() {
  let valid = true
  errors.username = ''
  errors.password = ''
  if (!form.username.trim()) { errors.username = 'Nom d\'utilisateur requis'; valid = false }
  if (!form.password) { errors.password = 'Mot de passe requis'; valid = false }
  return valid
}

async function handleLogin() {
  if (!validate()) return
  const success = await authStore.login({ username: form.username, password: form.password })
  if (success) {
    toast.success(`Bienvenue, ${authStore.user?.first_name || authStore.user?.username} !`)
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* Animated background orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: float 6s ease-in-out infinite;
}
.orb-1 {
  width: 400px; height: 400px;
  background: rgba(108, 99, 255, 0.15);
  top: -100px; left: -100px;
  animation-delay: 0s;
}
.orb-2 {
  width: 300px; height: 300px;
  background: rgba(0, 217, 255, 0.08);
  bottom: -80px; right: -80px;
  animation-delay: 2s;
}
.orb-3 {
  width: 200px; height: 200px;
  background: rgba(255, 77, 106, 0.06);
  top: 50%; right: 15%;
  animation-delay: 4s;
}
@keyframes float {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

.auth-container {
  background: rgba(19, 21, 42, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(108, 99, 255, 0.1);
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s ease;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}
.brand-icon {
  width: 52px; height: 52px;
  background: linear-gradient(135deg, rgba(108, 99, 255, 0.2), rgba(0, 217, 255, 0.1));
  border: 1px solid rgba(108, 99, 255, 0.3);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.brand-name {
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6C63FF, #00D9FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2px;
}
.brand-tagline { font-size: 0.8rem; color: var(--text-muted); }

.auth-form { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 77, 106, 0.1);
  border: 1px solid rgba(255, 77, 106, 0.3);
  color: var(--danger);
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.875rem;
  margin-bottom: 20px;
}

.input-group { position: relative; }
.input-group .form-input { padding-right: 44px; }
.input-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  opacity: 0.6;
  transition: opacity 0.15s;
  cursor: pointer;
}
.input-eye:hover { opacity: 1; }

.field-error { font-size: 0.8rem; color: var(--danger); margin-top: 2px; }

.auth-redirect {
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 16px;
}
.auth-link { color: var(--primary-light); font-weight: 600; margin-left: 4px; }
.auth-link:hover { text-decoration: underline; }

/* Responsive */
@media (max-width: 480px) {
  .auth-container { padding: 32px 24px; }
}
</style>
