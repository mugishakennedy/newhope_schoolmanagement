<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-vue-next'

import AuthShell from '@/components/auth/AuthShell.vue'
import { apiErrorMessage } from '@/api/client'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const mode = ref('student')
const showPassword = ref(false)
const error = ref('')
const expired = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const isStudent = computed(() => mode.value === 'student')
const submitting = computed(() => auth.loading)

function switchMode(next) {
  mode.value = next
  error.value = ''
}

async function submit() {
  error.value = ''

  if (!form.email.trim() || !form.password) {
    error.value = 'Enter your email and password to continue.'
    return
  }

  try {
    if (isStudent.value) {
      await auth.loginStudent(form.email.trim(), form.password)
    } else {
      await auth.loginAdmin(form.email.trim(), form.password)
    }

    toast.success(
      `Welcome back${auth.user?.full_name ? `, ${auth.user.full_name.split(' ')[0]}` : ''}!`,
    )

    const redirect = route.query.redirect
    router.push(
      typeof redirect === 'string' && redirect.startsWith('/')
        ? redirect
        : auth.homeRoute,
    )
  } catch (err) {
    error.value = apiErrorMessage(
      err,
      isStudent.value
        ? 'Unable to sign in. Check your credentials.'
        : 'Unable to sign in to the administration portal.',
    )
  }
}

onMounted(() => {
  if (route.query.expired) {
    expired.value = true
    toast.info('Your session expired. Please sign in again.')
  }
})
</script>

<template>
  <AuthShell>
    <div class="auth-kicker">
      <span class="kicker-dot" />
      Secure sign in
    </div>

    <h2>Welcome back</h2>
    <p class="auth-intro">
      Sign in to your NewHope workspace. Choose your portal below.
    </p>

    <div class="pill-tabs auth-tabs" role="tablist">
      <button
        type="button"
        :class="{ active: isStudent }"
        role="tab"
        @click="switchMode('student')"
      >
        <GraduationCap :size="15" />
        Student
      </button>
      <button
        type="button"
        :class="{ active: !isStudent }"
        role="tab"
        @click="switchMode('admin')"
      >
        <ShieldCheck :size="15" />
        Administrator
      </button>
    </div>

    <div v-if="expired" class="alert alert-info session-note">
      <AlertCircle :size="16" />
      Your previous session has ended. Sign in to continue.
    </div>

    <form class="auth-form" @submit.prevent="submit">
      <div class="field">
        <label for="email">Email address</label>
        <div class="input-wrap">
          <input
            id="email"
            v-model="form.email"
            class="input with-icon"
            type="email"
            autocomplete="email"
            placeholder="you@newhope.edu"
            required
          />
          <Mail :size="17" class="leading-icon" />
        </div>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <div class="input-wrap">
          <input
            id="password"
            v-model="form.password"
            class="input with-icon"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="isStudent ? 'current-password' : 'current-password'"
            placeholder="Enter your password"
            required
          />
          <LockKeyhole :size="17" class="leading-icon" />
          <button
            type="button"
            class="trail"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="17" />
            <Eye v-else :size="17" />
          </button>
        </div>
      </div>

      <p v-if="error" class="alert alert-error" role="alert">
        <AlertCircle :size="16" />
        {{ error }}
      </p>

      <button
        class="btn btn-primary btn-lg btn-block auth-submit"
        type="submit"
        :disabled="submitting"
      >
        <span v-if="submitting" class="spinner" />
        <template v-else>
          {{ isStudent ? 'Sign in as student' : 'Sign in to admin portal' }}
          <ArrowRight :size="17" />
        </template>
      </button>
    </form>

    <div class="auth-divider"><span>New to NewHope?</span></div>

    <router-link to="/register" class="btn btn-ghost btn-block">
      Create a student account
    </router-link>

    <p class="auth-helper">
      <template v-if="isStudent">
        Use the email and password you registered with.
      </template>
      <template v-else>
        Administration access is limited to Dean of Studies accounts.
      </template>
    </p>
  </AuthShell>
</template>

<style scoped>
.auth-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary-600);
  margin-bottom: 12px;
}

.kicker-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.12);
}

h2 {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.auth-intro {
  margin-top: 7px;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.6;
}

.auth-tabs {
  display: flex;
  width: 100%;
  margin: 22px 0 20px;
}

.auth-tabs button {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 10px;
}

.session-note {
  margin-bottom: 16px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.with-icon {
  padding-left: 42px;
}

.leading-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  color: var(--muted-2);
  pointer-events: none;
}

.input-wrap .input:focus ~ .leading-icon {
  color: var(--primary);
}

.auth-submit {
  margin-top: 4px;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0 16px;
  color: var(--muted-2);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  height: 1px;
  background: var(--line-2);
  flex: 1;
}

.auth-helper {
  margin-top: 16px;
  text-align: center;
  font-size: 0.74rem;
  color: var(--muted-2);
  line-height: 1.5;
}

@media (max-width: 420px) {
  .auth-tabs button {
    font-size: 0.76rem;
    padding: 8px 6px;
  }
}
</style>
