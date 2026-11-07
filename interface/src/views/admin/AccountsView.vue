<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertCircle,
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AvatarBadge from '@/components/AvatarBadge.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/format'

const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

const accounts = ref([])
const loading = ref(true)
const saving = ref(false)
const modalOpen = ref(false)
const showPassword = ref(false)
const error = ref('')

const form = reactive({
  full_name: '',
  email: '',
  password: '',
})

const checks = computed(() => [
  { label: 'At least 10 characters', ok: form.password.length >= 10 },
  { label: 'A lowercase letter', ok: /[a-z]/.test(form.password) },
  { label: 'An uppercase letter', ok: /[A-Z]/.test(form.password) },
  { label: 'A digit', ok: /\d/.test(form.password) },
  { label: 'A special character', ok: /[^A-Za-z0-9]/.test(form.password) },
])

const strength = computed(
  () => checks.value.filter((check) => check.ok).length,
)
const strengthLabel = computed(() => {
  if (!form.password) return 'Enter a password'
  if (strength.value <= 2) return 'Weak password'
  if (strength.value <= 4) return 'Almost there'
  return 'Strong password'
})
const strengthTone = computed(() => {
  if (strength.value <= 2) return 'weak'
  if (strength.value <= 4) return 'medium'
  return 'strong'
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/dos/accounts')
    accounts.value = data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load DOS accounts.'))
  } finally {
    loading.value = false
  }
}

function openModal() {
  error.value = ''
  showPassword.value = false
  form.full_name = ''
  form.email = ''
  form.password = ''
  modalOpen.value = true
}

async function submit() {
  error.value = ''
  if (!form.email.trim()) {
    error.value = 'An email address is required.'
    return
  }
  if (checks.value.some((check) => !check.ok)) {
    error.value = 'Choose a stronger password that meets every requirement.'
    return
  }

  saving.value = true
  try {
    const { data } = await api.post('/dos/accounts', {
      full_name: form.full_name.trim() || null,
      email: form.email.trim(),
      password: form.password,
    })
    accounts.value.push(data)
    toast.success('Administrator account created.')
    modalOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create this account.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  load()
  if (route.query.new === '1') openModal()
})
</script>

<template>
  <div class="page">
    <PageHeader
      title="DOS accounts"
      subtitle="Manage the people who can administer NewHope."
    >
      <template #actions>
        <button class="btn btn-primary" @click="openModal">
          <Plus :size="16" />
          New account
        </button>
      </template>
    </PageHeader>

    <div class="alert alert-info access-note">
      <ShieldCheck :size="18" />
      <span>
        Dean of Studies accounts have full administrative access — including
        teacher, class, module and grading management. Only create accounts for
        trusted staff.
      </span>
    </div>

    <div v-if="loading" class="grid grid-3">
      <div v-for="n in 3" :key="n" class="card card-pad">
        <div class="skeleton" style="width: 52px; height: 52px" />
        <div class="skeleton" style="width: 70%; height: 16px; margin-top: 16px" />
        <div class="skeleton" style="width: 90%; height: 12px; margin-top: 9px" />
      </div>
    </div>

    <div v-else-if="!accounts.length" class="card">
      <EmptyState
        title="No accounts yet"
        message="Create an administrator account to share the workload."
        :icon="ShieldCheck"
      >
        <button class="btn btn-primary" @click="openModal">
          <Plus :size="16" />
          Create account
        </button>
      </EmptyState>
    </div>

    <div v-else class="grid grid-3">
      <article
        v-for="account in accounts"
        :key="account.id"
        class="account-card card card-hover"
      >
        <div class="account-top">
          <AvatarBadge :name="account.full_name" size="lg" />
          <span
            v-if="account.id === auth.user?.id"
            class="badge badge-success"
          >
            <BadgeCheck :size="12" />
            You
          </span>
          <span v-else class="badge badge-primary">
            <ShieldCheck :size="12" />
            Admin
          </span>
        </div>
        <h3>{{ account.full_name }}</h3>
        <p class="account-email">{{ account.email }}</p>
        <div class="account-foot">
          <span class="small muted">Account #{{ account.id }}</span>
          <span class="small muted">Since {{ formatDate(account.created_at) }}</span>
        </div>
      </article>
    </div>

    <BaseModal
      v-model="modalOpen"
      title="Create a DOS account"
      subtitle="This person will be able to manage the whole platform."
    >
      <form id="account-form" class="form-grid" @submit.prevent="submit">
        <div class="field">
          <label for="full_name">Full name</label>
          <div class="input-wrap">
            <input
              id="full_name"
              v-model="form.full_name"
              class="input with-icon"
              type="text"
              placeholder="Optional — defaults to the email name"
              maxlength="150"
            />
            <UserRound :size="17" class="leading-icon" />
          </div>
        </div>

        <div class="field">
          <label for="email">Email</label>
          <div class="input-wrap">
            <input
              id="email"
              v-model="form.email"
              class="input with-icon"
              type="email"
              placeholder="admin@newhope.edu"
              maxlength="150"
              required
            />
            <BadgeCheck :size="17" class="leading-icon" />
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
              autocomplete="new-password"
              placeholder="Create a strong password"
              minlength="10"
              maxlength="72"
              required
            />
            <KeyRound :size="17" class="leading-icon" />
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

          <div class="strength">
            <div class="strength-bars">
              <span
                v-for="n in 5"
                :key="n"
                :class="[
                  `strength-${strengthTone}`,
                  { filled: n <= strength },
                ]"
              />
            </div>
            <span class="strength-label" :class="`label-${strengthTone}`">
              {{ strengthLabel }}
            </span>
          </div>

          <ul class="checks">
            <li
              v-for="check in checks"
              :key="check.label"
              :class="{ ok: check.ok }"
            >
              <span class="check-dot" />
              {{ check.label }}
            </li>
          </ul>
        </div>

        <p v-if="error" class="alert alert-error">
          <AlertCircle :size="16" />
          {{ error }}
        </p>
      </form>

      <template #footer>
        <button class="btn btn-ghost" type="button" @click="modalOpen = false">
          Cancel
        </button>
        <button
          class="btn btn-primary"
          type="submit"
          form="account-form"
          :disabled="saving || strength < 5"
        >
          <span v-if="saving" class="spinner" />
          <template v-else>
            <ShieldCheck :size="16" />
            Create account
          </template>
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.access-note {
  align-items: flex-start;
}

.access-note svg {
  color: #0369a1;
  flex-shrink: 0;
}

.account-card {
  padding: 20px;
}

.account-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.account-card h3 {
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.account-email {
  font-size: 0.8rem;
  color: var(--muted);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 16px;
  padding-top: 13px;
  border-top: 1px solid var(--line-2);
  flex-wrap: wrap;
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

.strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.strength-bars {
  display: flex;
  gap: 4px;
  flex: 1;
}

.strength-bars span {
  height: 6px;
  flex: 1;
  border-radius: 999px;
  background: var(--surface-3);
  transition: background 0.2s ease;
}

.strength-bars .filled.strength-weak {
  background: var(--danger);
}

.strength-bars .filled.strength-medium {
  background: var(--warning);
}

.strength-bars .filled.strength-strong {
  background: var(--success);
}

.strength-label {
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.label-weak {
  color: var(--danger);
}

.label-medium {
  color: var(--warning);
}

.label-strong {
  color: var(--success);
}

.checks {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px 12px;
}

.checks li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--muted);
}

.check-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--line);
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.checks li.ok {
  color: var(--ink-2);
}

.checks li.ok .check-dot {
  background: var(--success);
}

@media (max-width: 520px) {
  .checks {
    grid-template-columns: 1fr;
  }
}
</style>
