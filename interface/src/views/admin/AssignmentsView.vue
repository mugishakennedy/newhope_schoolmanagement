<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Clock3,
  GraduationCap,
  Plus,
  School,
  Search,
  UserRound,
  X,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'
import {
  daysUntil,
  formatDate,
  isOverdue,
  sortByName,
} from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const assignments = ref([])
const teachers = ref([])
const classes = ref([])
const modules = ref([])
const loading = ref(true)
const saving = ref(false)
const modalOpen = ref(false)
const loadingLinks = ref(false)
const teacherLinks = ref([])
const error = ref('')

const filters = reactive({
  search: '',
  class_id: '',
  teacher_id: '',
  module_id: '',
})

const form = reactive({
  teacher_id: '',
  module_id: '',
  class_id: '',
  title: '',
  description: '',
  deadline: '',
})

const teacherMap = computed(
  () => new Map(teachers.value.map((item) => [item.id, item])),
)
const classMap = computed(
  () => new Map(classes.value.map((item) => [item.id, item])),
)
const moduleMap = computed(
  () => new Map(modules.value.map((item) => [item.id, item])),
)

const filtered = computed(() => {
  const term = filters.search.trim().toLowerCase()
  return assignments.value.filter((item) => {
    if (filters.class_id && item.class_id !== Number(filters.class_id)) {
      return false
    }
    if (filters.teacher_id && item.teacher_id !== Number(filters.teacher_id)) {
      return false
    }
    if (filters.module_id && item.module_id !== Number(filters.module_id)) {
      return false
    }
    if (
      term &&
      !item.title.toLowerCase().includes(term) &&
      !(item.description || '').toLowerCase().includes(term)
    ) {
      return false
    }
    return true
  })
})

const hasFilters = computed(
  () =>
    Boolean(
      filters.search ||
        filters.class_id ||
        filters.teacher_id ||
        filters.module_id,
    ),
)

const upcomingCount = computed(
  () =>
    assignments.value.filter((item) => {
      const days = daysUntil(item.deadline)
      return days !== null && days >= 0
    }).length,
)

const overdueCount = computed(
  () => assignments.value.filter((item) => isOverdue(item.deadline)).length,
)

const availableModules = computed(() => {
  const ids = new Set(teacherLinks.value.map((link) => link.module_id))
  return sortByName(
    modules.value.filter((item) => ids.has(item.id)),
    'module_name',
  )
})

const availableClasses = computed(() => {
  const links = form.module_id
    ? teacherLinks.value.filter(
        (link) => link.module_id === Number(form.module_id),
      )
    : teacherLinks.value
  const ids = new Set(links.map((link) => link.class_id))
  return sortByName(
    classes.value.filter((item) => ids.has(item.id)),
    'class_name',
  )
})

function teacherName(id) {
  return teacherMap.value.get(id)?.full_name || `Teacher #${id}`
}

function className(id) {
  return classMap.value.get(id)?.class_name || `Class #${id}`
}

function classYear(id) {
  return classMap.value.get(id)?.academic_year || ''
}

function moduleName(id) {
  return moduleMap.value.get(id)?.module_name || `Module #${id}`
}

function moduleCode(id) {
  return moduleMap.value.get(id)?.module_code || ''
}

function deadlineTone(item) {
  if (!item.deadline) return 'badge'
  if (isOverdue(item.deadline)) return 'badge badge-danger'
  const days = daysUntil(item.deadline)
  if (days !== null && days <= 3) return 'badge badge-warning'
  return 'badge badge-info'
}

function deadlineText(item) {
  if (!item.deadline) return 'No deadline'
  const days = daysUntil(item.deadline)
  if (isOverdue(item.deadline)) {
    return `Overdue · ${formatDate(item.deadline)}`
  }
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days !== null && days > 1) return `Due in ${days} days`
  return formatDate(item.deadline)
}

function clearFilters() {
  filters.search = ''
  filters.class_id = ''
  filters.teacher_id = ''
  filters.module_id = ''
}

async function load() {
  loading.value = true
  try {
    const [assignmentsRes, teachersRes, classesRes, modulesRes] =
      await Promise.all([
        api.get('/dos/assignments'),
        api.get('/dos/teachers'),
        api.get('/dos/classes'),
        api.get('/dos/modules'),
      ])
    assignments.value = assignmentsRes.data
    teachers.value = teachersRes.data
    classes.value = classesRes.data
    modules.value = modulesRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load assignments.'))
  } finally {
    loading.value = false
  }
}

function openModal() {
  error.value = ''
  form.teacher_id = ''
  form.module_id = ''
  form.class_id = ''
  form.title = ''
  form.description = ''
  form.deadline = ''
  teacherLinks.value = []
  modalOpen.value = true
}

async function onTeacherChange() {
  form.module_id = ''
  form.class_id = ''
  teacherLinks.value = []
  if (!form.teacher_id) return

  loadingLinks.value = true
  try {
    const { data } = await api.get(
      `/dos/teachers/${form.teacher_id}/modules`,
    )
    teacherLinks.value = data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load teacher assignments.'))
  } finally {
    loadingLinks.value = false
  }
}

function onModuleChange() {
  if (!form.class_id) return
  const allowed = availableClasses.value.some(
    (item) => item.id === Number(form.class_id),
  )
  if (!allowed) form.class_id = ''
}

async function submit() {
  error.value = ''
  if (
    !form.teacher_id ||
    !form.module_id ||
    !form.class_id ||
    !form.title.trim()
  ) {
    error.value = 'Teacher, module, class and title are required.'
    return
  }

  saving.value = true
  try {
    const { data } = await api.post('/dos/assignments', {
      teacher_id: Number(form.teacher_id),
      module_id: Number(form.module_id),
      class_id: Number(form.class_id),
      title: form.title.trim(),
      description: form.description.trim() || null,
      deadline: form.deadline || null,
    })
    assignments.value.push(data)
    toast.success('Assignment published successfully.')
    modalOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create the assignment.')
  } finally {
    saving.value = false
  }
}

watch(
  () => route.query.new,
  (value) => {
    if (value === '1') {
      openModal()
      router.replace({ query: {} })
    }
  },
)

onMounted(() => {
  load()
  if (route.query.new === '1') {
    openModal()
    router.replace({ query: {} })
  }
})
</script>

<template>
  <div class="page">
    <PageHeader
      title="Assignments"
      subtitle="Publish work to classes and keep every deadline in view."
    >
      <template #actions>
        <button class="btn btn-primary" @click="openModal">
          <Plus :size="16" />
          New assignment
        </button>
      </template>
    </PageHeader>

    <div class="summary-row">
      <div class="summary-pill">
        <span class="summary-icon"><ClipboardList :size="17" /></span>
        <div>
          <strong>{{ assignments.length }}</strong>
          <span>total</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon sky"><CalendarClock :size="17" /></span>
        <div>
          <strong>{{ upcomingCount }}</strong>
          <span>upcoming</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon red"><Clock3 :size="17" /></span>
        <div>
          <strong>{{ overdueCount }}</strong>
          <span>past deadline</span>
        </div>
      </div>
    </div>

    <div class="toolbar filter-bar">
      <div class="search">
        <Search :size="17" />
        <input
          v-model="filters.search"
          class="input"
          type="search"
          placeholder="Search assignments…"
        />
      </div>
      <select v-model="filters.class_id" class="select select-compact">
        <option value="">All classes</option>
        <option v-for="item in classes" :key="item.id" :value="item.id">
          {{ item.class_name }}
        </option>
      </select>
      <select v-model="filters.teacher_id" class="select select-compact">
        <option value="">All teachers</option>
        <option v-for="item in teachers" :key="item.id" :value="item.id">
          {{ item.full_name }}
        </option>
      </select>
      <select v-model="filters.module_id" class="select select-compact">
        <option value="">All modules</option>
        <option v-for="item in modules" :key="item.id" :value="item.id">
          {{ item.module_code }}
        </option>
      </select>
      <button
        v-if="hasFilters"
        class="btn btn-ghost btn-sm"
        @click="clearFilters"
      >
        <X :size="14" />
        Clear
      </button>
    </div>

    <div v-if="loading" class="grid grid-2">
      <div v-for="n in 4" :key="n" class="card card-pad">
        <div class="skeleton" style="width: 42px; height: 42px" />
        <div class="skeleton" style="width: 72%; height: 18px; margin-top: 16px" />
        <div class="skeleton" style="width: 94%; height: 12px; margin-top: 10px" />
        <div class="skeleton" style="width: 60%; height: 12px; margin-top: 8px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="card">
      <EmptyState
        title="No assignments found"
        :message="
          hasFilters
            ? 'Try adjusting your filters or search term.'
            : 'Publish the first assignment to a class.'
        "
        :icon="ClipboardList"
      >
        <button
          v-if="!hasFilters"
          class="btn btn-primary"
          @click="openModal"
        >
          <Plus :size="16" />
          Create assignment
        </button>
        <button v-else class="btn btn-ghost" @click="clearFilters">
          Clear filters
        </button>
      </EmptyState>
    </div>

    <div v-else class="grid grid-2">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="assignment-card card card-hover"
      >
        <div class="assignment-top">
          <span class="assignment-icon"><ClipboardList :size="20" /></span>
          <span :class="deadlineTone(item)">{{ deadlineText(item) }}</span>
        </div>
        <h3>{{ item.title }}</h3>
        <p class="assignment-desc">
          {{ item.description || 'No description provided for this assignment.' }}
        </p>
        <div class="assignment-chips">
          <span class="chip">
            <School :size="13" />
            {{ className(item.class_id) }}
            <template v-if="classYear(item.class_id)">
              · {{ classYear(item.class_id) }}
            </template>
          </span>
          <span class="chip">
            <BookOpen :size="13" />
            {{ moduleCode(item.module_id) || moduleName(item.module_id) }}
          </span>
          <span class="chip">
            <GraduationCap :size="13" />
            {{ teacherName(item.teacher_id) }}
          </span>
        </div>
        <div class="assignment-foot">
          <span class="small muted">
            Created {{ formatDate(item.created_at) }}
          </span>
          <span class="small muted">Assignment #{{ item.id }}</span>
        </div>
      </article>
    </div>

    <BaseModal
      v-model="modalOpen"
      size="lg"
      title="New assignment"
      subtitle="Only teachers already assigned to a module and class can be selected."
    >
      <form id="assignment-form" class="form-grid" @submit.prevent="submit">
        <div class="field">
          <label for="teacher_id">Teacher</label>
          <select
            id="teacher_id"
            v-model="form.teacher_id"
            class="select"
            required
            @change="onTeacherChange"
          >
            <option value="">Select a teacher</option>
            <option v-for="item in teachers" :key="item.id" :value="item.id">
              {{ item.full_name }} · {{ item.employee_code }}
            </option>
          </select>
        </div>

        <div v-if="form.teacher_id" class="assign-scope">
          <div v-if="loadingLinks" class="row small muted">
            <span class="spinner spinner-dark" />
            Loading this teacher's modules…
          </div>
          <div
            v-else-if="!teacherLinks.length"
            class="alert alert-info"
          >
            <AlertCircle :size="16" />
            <span>
              This teacher has no modules assigned yet.
              <router-link to="/admin/teachers" class="link">
                Assign modules first
              </router-link>
              , then create the assignment.
            </span>
          </div>
          <template v-else>
            <div class="form-grid form-2">
              <div class="field">
                <label for="module_id">Module</label>
                <select
                  id="module_id"
                  v-model="form.module_id"
                  class="select"
                  required
                  @change="onModuleChange"
                >
                  <option value="">Select a module</option>
                  <option
                    v-for="item in availableModules"
                    :key="item.id"
                    :value="item.id"
                  >
                    {{ item.module_code }} · {{ item.module_name }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label for="class_id">Class</label>
                <select
                  id="class_id"
                  v-model="form.class_id"
                  class="select"
                  required
                  :disabled="!form.module_id"
                >
                  <option value="">
                    {{ form.module_id ? 'Select a class' : 'Choose a module first' }}
                  </option>
                  <option
                    v-for="item in availableClasses"
                    :key="item.id"
                    :value="item.id"
                  >
                    {{ item.class_name }} · {{ item.academic_year }}
                  </option>
                </select>
              </div>
            </div>
          </template>
        </div>

        <div class="field">
          <label for="title">Title</label>
          <input
            id="title"
            v-model="form.title"
            class="input"
            type="text"
            placeholder="e.g. Chapter 4 problem set"
            maxlength="200"
            required
          />
        </div>

        <div class="field">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            class="textarea"
            placeholder="Give students context, instructions and expectations…"
          />
        </div>

        <div class="field">
          <label for="deadline">Deadline</label>
          <input
            id="deadline"
            v-model="form.deadline"
            class="input"
            type="datetime-local"
          />
          <span class="hint">Optional. Students will see a countdown.</span>
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
          form="assignment-form"
          :disabled="saving || !teacherLinks.length"
        >
          <span v-if="saving" class="spinner" />
          <template v-else>
            <Plus :size="16" />
            Publish assignment
          </template>
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.summary-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px 9px 9px;
  border-radius: 13px;
  background: var(--surface);
  border: 1px solid var(--line-2);
  box-shadow: var(--shadow-xs);
}

.summary-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary-700);
}

.summary-icon.sky {
  background: var(--accent-soft);
  color: #0369a1;
}

.summary-icon.red {
  background: var(--danger-soft);
  color: var(--danger);
}

.summary-pill > div {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.summary-pill strong {
  font-size: 1rem;
  font-weight: 800;
}

.summary-pill span:not(.summary-icon) {
  font-size: 0.7rem;
  color: var(--muted);
}

.filter-bar {
  align-items: center;
}

.filter-bar .search {
  max-width: 320px;
}

.assignment-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.assignment-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.assignment-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: linear-gradient(135deg, #eef2ff, #e0f2fe);
  color: var(--primary-700);
  border: 1px solid #e5eaff;
}

.assignment-card h3 {
  font-size: 1.06rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.assignment-desc {
  font-size: 0.84rem;
  color: var(--muted);
  line-height: 1.55;
  min-height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.assignment-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.assignment-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
  padding-top: 13px;
  border-top: 1px solid var(--line-2);
  flex-wrap: wrap;
}

.assign-scope {
  padding: 14px;
  border-radius: 13px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
}
</style>
