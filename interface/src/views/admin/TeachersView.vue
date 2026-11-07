<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  Plus,
  School,
  Search,
  Settings2,
  Users,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AvatarBadge from '@/components/AvatarBadge.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/format'

const route = useRoute()
const toast = useToast()

const teachers = ref([])
const classes = ref([])
const modules = ref([])
const linksByTeacher = ref(new Map())
const loading = ref(true)
const saving = ref(false)
const modalOpen = ref(false)
const manageOpen = ref(false)
const manageLoading = ref(false)
const savingLink = ref(false)
const search = ref('')
const error = ref('')
const linkError = ref('')
const selectedTeacher = ref(null)
const selectedLinks = ref([])

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  employee_code: '',
})

const linkForm = reactive({
  module_id: '',
  class_id: '',
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return teachers.value
  return teachers.value.filter(
    (item) =>
      item.full_name.toLowerCase().includes(term) ||
      item.email.toLowerCase().includes(term) ||
      item.employee_code.toLowerCase().includes(term),
  )
})

const moduleMap = computed(
  () => new Map(modules.value.map((item) => [item.id, item])),
)
const classMap = computed(
  () => new Map(classes.value.map((item) => [item.id, item])),
)

function teacherLinks(id) {
  return linksByTeacher.value.get(id) || []
}

function moduleLabel(link) {
  const module = moduleMap.value.get(link.module_id)
  return module
    ? `${module.module_code} · ${module.module_name}`
    : `Module #${link.module_id}`
}

function classLabel(id) {
  const item = classMap.value.get(id)
  return item ? `${item.class_name} (${item.academic_year})` : `Class #${id}`
}

async function loadLinksFor(teacherId) {
  try {
    const { data } = await api.get(`/dos/teachers/${teacherId}/modules`)
    linksByTeacher.value = new Map(linksByTeacher.value).set(teacherId, data)
    return data
  } catch {
    return []
  }
}

async function load() {
  loading.value = true
  try {
    const [teachersRes, classesRes, modulesRes] = await Promise.all([
      api.get('/dos/teachers'),
      api.get('/dos/classes'),
      api.get('/dos/modules'),
    ])
    teachers.value = teachersRes.data
    classes.value = classesRes.data
    modules.value = modulesRes.data

    const results = await Promise.allSettled(
      teachers.value.map((teacher) =>
        api.get(`/dos/teachers/${teacher.id}/modules`),
      ),
    )
    const map = new Map()
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        map.set(teachers.value[index].id, result.value.data)
      }
    })
    linksByTeacher.value = map
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load teachers.'))
  } finally {
    loading.value = false
  }
}

function openModal() {
  error.value = ''
  form.full_name = ''
  form.email = ''
  form.password = ''
  form.employee_code = ''
  modalOpen.value = true
}

async function submit() {
  error.value = ''
  if (
    !form.full_name.trim() ||
    !form.email.trim() ||
    !form.password ||
    !form.employee_code.trim()
  ) {
    error.value = 'All fields are required to create a teacher.'
    return
  }
  if (form.password.length < 8) {
    error.value = 'Password must be at least 8 characters long.'
    return
  }

  saving.value = true
  try {
    const { data } = await api.post('/dos/teachers', {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      employee_code: form.employee_code.trim(),
    })
    teachers.value.push(data)
    toast.success(`${data.full_name} was added to the faculty.`)
    modalOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create the teacher.')
  } finally {
    saving.value = false
  }
}

async function openManage(teacher) {
  selectedTeacher.value = teacher
  selectedLinks.value = teacherLinks(teacher.id)
  linkForm.module_id = ''
  linkForm.class_id = ''
  linkError.value = ''
  manageOpen.value = true
  manageLoading.value = true
  selectedLinks.value = await loadLinksFor(teacher.id)
  manageLoading.value = false
}

async function addLink() {
  linkError.value = ''
  if (!linkForm.module_id || !linkForm.class_id) {
    linkError.value = 'Choose both a module and a class.'
    return
  }

  savingLink.value = true
  try {
    const { data } = await api.post(
      `/dos/teachers/${selectedTeacher.value.id}/modules`,
      {
        module_id: Number(linkForm.module_id),
        class_id: Number(linkForm.class_id),
      },
    )
    selectedLinks.value.push(data)
    linksByTeacher.value = new Map(linksByTeacher.value).set(
      selectedTeacher.value.id,
      [...selectedLinks.value],
    )
    linkForm.module_id = ''
    linkForm.class_id = ''
    toast.success('Teaching assignment added.')
  } catch (err) {
    linkError.value = apiErrorMessage(
      err,
      'Could not assign this module.',
    )
  } finally {
    savingLink.value = false
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
      title="Teachers"
      subtitle="Manage your faculty and the modules they teach."
    >
      <template #actions>
        <button class="btn btn-primary" @click="openModal">
          <Plus :size="16" />
          Add teacher
        </button>
      </template>
    </PageHeader>

    <div class="toolbar">
      <div class="search">
        <Search :size="17" />
        <input
          v-model="search"
          class="input"
          type="search"
          placeholder="Search by name, email or employee code…"
        />
      </div>
      <span class="chip">
        <Users :size="14" />
        {{ teachers.length }} teacher{{ teachers.length === 1 ? '' : 's' }}
      </span>
    </div>

    <div v-if="loading" class="card card-pad">
      <div class="stack">
        <div v-for="n in 6" :key="n" class="skeleton" style="height: 52px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="card">
      <EmptyState
        title="No teachers found"
        :message="
          search
            ? 'Try a different search term.'
            : 'Add your first teacher to begin assigning modules.'
        "
        :icon="GraduationCap"
      >
        <button v-if="!search" class="btn btn-primary" @click="openModal">
          <Plus :size="16" />
          Add a teacher
        </button>
      </EmptyState>
    </div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Teacher</th>
            <th>Employee code</th>
            <th>Modules</th>
            <th>Joined</th>
            <th class="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="teacher in filtered" :key="teacher.id">
            <td>
              <div class="cell-main">
                <AvatarBadge :name="teacher.full_name" />
                <div>
                  <div class="cell-title">{{ teacher.full_name }}</div>
                  <div class="cell-sub">{{ teacher.email }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="badge badge-primary">{{ teacher.employee_code }}</span>
            </td>
            <td>
              <div v-if="teacherLinks(teacher.id).length" class="module-chips">
                <span
                  v-for="link in teacherLinks(teacher.id).slice(0, 2)"
                  :key="link.id"
                  class="chip"
                >
                  {{ moduleMap.get(link.module_id)?.module_code || `#${link.module_id}` }}
                </span>
                <span
                  v-if="teacherLinks(teacher.id).length > 2"
                  class="chip more"
                >
                  +{{ teacherLinks(teacher.id).length - 2 }}
                </span>
              </div>
              <span v-else class="small muted">No modules yet</span>
            </td>
            <td class="small muted">{{ formatDate(teacher.created_at) }}</td>
            <td>
              <div class="row-end">
                <button class="btn btn-soft btn-sm" @click="openManage(teacher)">
                  <Settings2 :size="14" />
                  Manage modules
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal
      v-model="modalOpen"
      title="Add a teacher"
      subtitle="Create a faculty account and employee profile."
    >
      <form id="teacher-form" class="form-grid" @submit.prevent="submit">
        <div class="field">
          <label for="full_name">Full name</label>
          <input
            id="full_name"
            v-model="form.full_name"
            class="input"
            type="text"
            placeholder="e.g. Grace Nkosi"
            maxlength="150"
            required
          />
        </div>
        <div class="form-grid form-2">
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              class="input"
              type="email"
              placeholder="teacher@newhope.edu"
              maxlength="150"
              required
            />
          </div>
          <div class="field">
            <label for="employee_code">Employee code</label>
            <input
              id="employee_code"
              v-model="form.employee_code"
              class="input"
              type="text"
              placeholder="e.g. TCH-014"
              maxlength="50"
              required
            />
          </div>
        </div>
        <div class="field">
          <label for="password">Temporary password</label>
          <input
            id="password"
            v-model="form.password"
            class="input"
            type="password"
            autocomplete="new-password"
            placeholder="At least 8 characters"
            minlength="8"
            maxlength="72"
            required
          />
          <span class="hint">
            Share this securely with the teacher. It should be changed later.
          </span>
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
          form="teacher-form"
          :disabled="saving"
        >
          <span v-if="saving" class="spinner" />
          <template v-else>
            <Plus :size="16" />
            Add teacher
          </template>
        </button>
      </template>
    </BaseModal>

    <BaseModal
      v-model="manageOpen"
      size="lg"
      :title="selectedTeacher ? `${selectedTeacher.full_name}'s modules` : 'Modules'"
      subtitle="Assign the modules and classes this teacher is responsible for."
    >
      <div class="manage-head">
        <div class="cell-main">
          <AvatarBadge
            v-if="selectedTeacher"
            :name="selectedTeacher.full_name"
            size="lg"
          />
          <div>
            <div class="cell-title">{{ selectedTeacher?.full_name }}</div>
            <div class="cell-sub">{{ selectedTeacher?.email }}</div>
          </div>
        </div>
        <span class="badge badge-primary">
          {{ selectedLinks.length }} assignment{{ selectedLinks.length === 1 ? '' : 's' }}
        </span>
      </div>

      <div v-if="manageLoading" class="stack">
        <div v-for="n in 3" :key="n" class="skeleton" style="height: 46px" />
      </div>

      <div v-else class="assigned-list">
        <div v-if="!selectedLinks.length" class="assigned-empty">
          <BookOpen :size="18" />
          <span>No modules assigned yet. Add one below.</span>
        </div>
        <div
          v-for="link in selectedLinks"
          :key="link.id"
          class="assigned-item"
        >
          <span class="assigned-icon"><BookOpen :size="16" /></span>
          <div class="assigned-main">
            <strong>{{ moduleLabel(link) }}</strong>
            <span>
              <School :size="12" />
              {{ classLabel(link.class_id) }}
            </span>
          </div>
        </div>
      </div>

      <div class="assign-form">
        <p class="assign-title">Assign a new module</p>
        <div class="form-grid form-2">
          <div class="field">
            <label for="link_module">Module</label>
            <select id="link_module" v-model="linkForm.module_id" class="select">
              <option value="">Select a module</option>
              <option v-for="item in modules" :key="item.id" :value="item.id">
                {{ item.module_code }} · {{ item.module_name }}
              </option>
            </select>
          </div>
          <div class="field">
            <label for="link_class">Class</label>
            <select id="link_class" v-model="linkForm.class_id" class="select">
              <option value="">Select a class</option>
              <option v-for="item in classes" :key="item.id" :value="item.id">
                {{ item.class_name }} · {{ item.academic_year }}
              </option>
            </select>
          </div>
        </div>
        <p v-if="linkError" class="alert alert-error">
          <AlertCircle :size="16" />
          {{ linkError }}
        </p>
        <button
          class="btn btn-primary btn-block"
          type="button"
          :disabled="savingLink"
          @click="addLink"
        >
          <span v-if="savingLink" class="spinner" />
          <template v-else>
            <Plus :size="16" />
            Assign module
          </template>
        </button>
      </div>

      <template #footer>
        <button class="btn btn-ghost" type="button" @click="manageOpen = false">
          Done
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.head-actions,
.row-end {
  display: flex;
  justify-content: flex-end;
}

.right {
  text-align: right;
}

.module-chips {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.chip.more {
  background: var(--primary-soft);
  color: var(--primary-700);
  border-color: transparent;
}

.manage-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border-radius: 14px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.assigned-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.assigned-empty {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 16px;
  border-radius: 12px;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-size: 0.84rem;
}

.assigned-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  border-radius: 12px;
  border: 1px solid var(--line-2);
  background: var(--surface);
}

.assigned-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--violet-soft);
  color: var(--violet);
  flex-shrink: 0;
}

.assigned-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.assigned-main strong {
  font-size: 0.85rem;
  font-weight: 700;
}

.assigned-main span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  color: var(--muted);
}

.assign-form {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding-top: 18px;
  border-top: 1px solid var(--line-2);
}

.assign-title {
  font-size: 0.86rem;
  font-weight: 800;
}

@media (max-width: 720px) {
  .table {
    min-width: 760px;
  }
}
</style>
