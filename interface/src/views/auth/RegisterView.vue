<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Hash,
  LockKeyhole,
  Mail,
  School,
  UserRound,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AuthShell from '@/components/auth/AuthShell.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const classes = ref([])
const loadingClasses = ref(false)
const submitting = ref(false)
const showPassword = ref(false)
const error = ref('')

const form = reactive({
  full_name: '',
  email: '',
  registration_no: '',
  password: '',
  confirm_password: '',
  class_id: '',
})

async function loadClasses() {
  loadingClasses.value = true
  try {
    const { data } = await api.get('/public/classes')
    classes.value = data
  } catch {
    classes.value = []
  } finally {
    loadingClasses.value = false
  }
}

async function submit() {
  error.value = ''

  if (!form.full_name.trim() || !form.email.trim()) {
    error.value = 'Your full name and email are required.'
    return
  }
  if (!form.registration_no.trim()) {
    error.value = 'Please provide your registration number.'
    return
  }
  if (form.password.length < 8) {
    error.value = 'Password must be at least 8 characters long.'
    return
  }
  if (form.password !== form.confirm_password) {
    error.value = 'The two passwords do not match.'
    return
  }

  submitting.value = true
  try {
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      registration_no: form.registration_no.trim(),
      class_id: form.class_id ? Number(form.class_id) : null,
    }

    await api.post('/students/register', payload)
    await auth.loginStudent(payload.email, payload.password)
    toast.success('Your account is ready. Welcome to NewHope!')
    router.push('/student')
  } catch (err) {
    error.value = apiErrorMessage(
      err,
      'We could not create your account. Please review your details.',
    )
  } finally {
    submitting.value = false
  }
}

onMounted(loadClasses)
</script>

<template>
  <AuthShell
    headline="Start your NewHope journey today."
    description="Create your student account to follow assignments, submit work and see feedback — all in one place."
  >
    <router-link to="/login" class="back-link">
      <ArrowLeft :size="15" />
      Back to sign in
    </router-link>

    <div class="auth-kicker">
      <BadgeCheck :size="14" />
      Student registration
    </div>

    <h2>Create your account</h2>
    <p class="auth-intro">
      Join your class workspace in less than a minute.
    </p>

    <form class="auth-form" @submit.prevent="submit">
      <div class="field">
        <label for="full_name">Full name</label>
        <div class="input-wrap">
          <input
            id="full_name"
            v-model="form.full_name"
            class="input with-icon"
            type="text"
            autocomplete="name"
            placeholder="e.g. Amina Kamara"
            required
          />
          <UserRound :size="17" class="leading-icon" />
        </div>
      </div>

      <div class="form-grid form-2">
        <div class="field">
          <label for="email">Email</label>
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
          <label for="registration_no">Registration no.</label>
          <div class="input-wrap">
            <input
              id="registration_no"
              v-model="form.registration_no"
              class="input with-icon"
              type="text"
              placeholder="e.g. NH-2026-001"
              required
            />
            <Hash :size="17" class="leading-icon" />
          </div>
        </div>
      </div>

      <div class="field">
        <label for="class_id">Class</label>
        <div class="input-wrap">
          <select id="class_id" v-model="form.class_id" class="select with-icon">
            <option value="">
              {{ loadingClasses ? 'Loading classes…' : 'Select a class (optional)' }}
            </option>
            <option v-for="item in classes" :key="item.id" :value="item.id">
              {{ item.class_name }} · {{ item.academic_year }}
            </option>
          </select>
          <School :size="17" class="leading-icon" />
        </div>
        <span class="hint">
          No class yet? Leave this empty — an administrator can place you later.
        </span>
      </div>

      <div class="form-grid form-2">
        <div class="field">
          <label for="password">Password</label>
          <div class="input-wrap">
            <input
              id="password"
              v-model="form.password"
              class="input with-icon"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="At least 8 characters"
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

        <div class="field">
          <label for="confirm_password">Confirm password</label>
          <div class="input-wrap">
            <input
              id="confirm_password"
              v-model="form.confirm_password"
              class="input with-icon"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Repeat your password"
              required
            />
            <LockKeyhole :size="17" class="leading-icon" />
          </div>
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
          Create my account
          <ArrowRight :size="17" />
        </template>
      </button>
    </form>

    <p class="auth-helper">
      Already registered?
      <router-link to="/login" class="link">Sign in instead</router-link>
    </p>
  </AuthShell>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--muted);
  margin-bottom: 18px;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--primary-600);
}

.auth-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary-600);
  margin-bottom: 10px;
}

h2 {
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.auth-intro {
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.55;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 22px;
}

.with-icon {
  padding-left: 42px;
}

.select.with-icon {
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

.auth-submit {
  margin-top: 4px;
}

.auth-helper {
  margin-top: 18px;
  text-align: center;
  font-size: 0.78rem;
  color: var(--muted);
}

@media (max-width: 460px) {
  h2 {
    font-size: 1.45rem;
  }
}
</style>
