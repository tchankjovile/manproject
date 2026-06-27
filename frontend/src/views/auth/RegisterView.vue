<template>
  <div class="auth-layout">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <div class="auth-container">
      <div class="auth-brand">
        <div class="brand-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 8h24M4 16h16M4 24h20" stroke="url(#g2)" stroke-width="2.5" stroke-linecap="round"/>
            <defs>
              <linearGradient id="g2" x1="0" y1="0" x2="32" y2="0">
                <stop offset="0%" stop-color="#6C63FF"/>
                <stop offset="100%" stop-color="#00D9FF"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h1 class="brand-name">CollabFlow</h1>
          <p class="brand-tagline">Créez votre compte</p>
        </div>
      </div>

      <Transition name="fade">
        <div v-if="authStore.error" class="error-banner" role="alert">
          <span>⚠️</span>
          <span>{{ typeof authStore.error === 'string' ? authStore.error : 'Vérifiez vos informations' }}</span>
        </div>
      </Transition>

      <form @submit.prevent="handleRegister" class="auth-form" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="first_name">Prénom</label>
            <input id="first_name" v-model="form.first_name" type="text" class="form-input" placeholder="John" />
          </div>
          <div class="form-group">
            <label class="form-label" for="last_name">Nom</label>
            <input id="last_name" v-model="form.last_name" type="text" class="form-input" placeholder="Doe" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-username">Nom d'utilisateur</label>
          <input
            id="reg-username"
            v-model="form.username"
            type="text"
            class="form-input"
            :class="{ error: errors.username }"
            placeholder="johndoe"
            autocomplete="username"
          />
          <span v-if="errors.username" class="field-error">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            :class="{ error: errors.email }"
            placeholder="john@example.com"
            autocomplete="email"
          />
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="role">Rôle</label>
          <select id="role" v-model="form.role" class="form-input">
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-password">Mot de passe</label>
          <div class="input-group">
            <input
              id="reg-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ error: errors.password }"
              placeholder="Min. 8 caractères"
              autocomplete="new-password"
            />
            <button type="button" class="input-eye" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="password2">Confirmer le mot de passe</label>
          <input
            id="password2"
            v-model="form.password2"
            type="password"
            class="form-input"
            :class="{ error: errors.password2 }"
            placeholder="Répétez le mot de passe"
            autocomplete="new-password"
          />
          <span v-if="errors.password2" class="field-error">{{ errors.password2 }}</span>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="authStore.loading" id="register-submit-btn">
          <span v-if="authStore.loading" class="spinner spinner-sm"></span>
          <span>{{ authStore.loading ? 'Création...' : 'Créer mon compte' }}</span>
        </button>
      </form>

      <div class="divider">ou</div>

      <p class="auth-redirect">
        Déjà un compte ?
        <router-link to="/login" class="auth-link">Se connecter</router-link>
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

const form = reactive({
  username: '', email: '', password: '', password2: '',
  first_name: '', last_name: '', role: 'member'
})
const errors = reactive({ username: '', email: '', password: '', password2: '' })

function validate() {
  let valid = true
  Object.keys(errors).forEach(k => errors[k] = '')
  if (!form.username.trim()) { errors.username = 'Nom d\'utilisateur requis'; valid = false }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Email invalide'; valid = false }
  if (form.password.length < 8) { errors.password = 'Minimum 8 caractères'; valid = false }
  if (form.password !== form.password2) { errors.password2 = 'Les mots de passe ne correspondent pas'; valid = false }
  return valid
}

async function handleRegister() {
  if (!validate()) return
  const payload = {
    username: form.username,
    email: form.email,
    password: form.password,
    first_name: form.first_name,
    last_name: form.last_name,
    role: form.role
  }
  const success = await authStore.register(payload)
  if (success) {
    toast.success('Compte créé ! Veuillez vous connecter.')
    router.push('/login')
  }
}
</script>

<style scoped>
/* Reuse from LoginView */
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: float 6s ease-in-out infinite;
}
.orb-1 { width: 400px; height: 400px; background: rgba(108, 99, 255, 0.12); top: -100px; left: -100px; }
.orb-2 { width: 300px; height: 300px; background: rgba(0, 217, 255, 0.07); bottom: -80px; right: -80px; animation-delay: 2s; }
.orb-3 { width: 200px; height: 200px; background: rgba(0, 200, 150, 0.06); top: 30%; right: 10%; animation-delay: 3s; }
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
}

.auth-container {
  background: rgba(19, 21, 42, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 40px 48px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(108, 99, 255, 0.1);
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s ease;
}

.auth-brand { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.brand-icon {
  width: 52px; height: 52px;
  background: linear-gradient(135deg, rgba(108, 99, 255, 0.2), rgba(0, 217, 255, 0.1));
  border: 1px solid rgba(108, 99, 255, 0.3);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.brand-name {
  font-size: 1.6rem; font-weight: 800;
  background: linear-gradient(135deg, #6C63FF, #00D9FF);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.brand-tagline { font-size: 0.8rem; color: var(--text-muted); }

.auth-form { display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.error-banner {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255, 77, 106, 0.1);
  border: 1px solid rgba(255, 77, 106, 0.3);
  color: var(--danger); padding: 12px 16px;
  border-radius: 10px; font-size: 0.875rem; margin-bottom: 20px;
}

.input-group { position: relative; }
.input-group .form-input { padding-right: 44px; }
.input-eye {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 1rem; opacity: 0.6; cursor: pointer; transition: opacity 0.15s;
}
.input-eye:hover { opacity: 1; }

.field-error { font-size: 0.8rem; color: var(--danger); margin-top: 2px; }
.auth-redirect { text-align: center; font-size: 0.875rem; color: var(--text-secondary); margin-top: 16px; }
.auth-link { color: var(--primary-light); font-weight: 600; margin-left: 4px; }
.auth-link:hover { text-decoration: underline; }

@media (max-width: 480px) {
  .auth-container { padding: 32px 24px; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
