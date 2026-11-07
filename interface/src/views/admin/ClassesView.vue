<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Plus,
  School,
  Search,
  Users,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AvatarBadge from '@/components/AvatarBadge.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const toast = useToast()

const items = ref([])
const students = ref([])
const loading = ref(true)
const saving = ref(false)
const modalOpen = ref(false)
const search = ref('')
const error = ref('')

const now = new Date()
const form = reactive({
  class_name: '',
  academic_year: `${now.getFullYear()}/${now.getFullYear() + 1}`,
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return items.value
  return items.value.filter(
    (item) =>
      item.class_name.toLowerCase().includes(term) ||
      item.academic_year.toLowerCase().includes(term),
  )
})

const studentsByClass = computed(() => {
  const map = new Map()
  for (const student of students.value) {
    if (student.class_id === null || student.class_id === undefined) continue
    const list = map.get(student.class_id) || []
    list.push(student)
    map.set(student.class_id, list)
  }
  return map
})

const academicYears = computed(
  () => new Set(items.value.map((item) => item.academic_year)).size,
)

function classStudents(id) {
  return studentsByClass.value.get(id) || []
}

async function load() {
  loading.value = true
  try {
    const [classesRes, studentsRes] = await Promise.all([
      api.get('/dos/classes'),
      api.get('/dos/students'),
    ])
    items.value = classesRes.data
    students.value = studentsRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load classes.'))
  } finally {
    loading.value = false
  }
}

function openModal() {
  error.value = ''
  form.class_name = ''
  form.academic_year = `${now.getFullYear()}/${now.getFullYear() + 1}`
  modalOpen.value = true
}

async function submit() {
  error.value = ''
  if (!form.class_name.trim() || !form.academic_year.trim()) {
    error.value = 'Class name and academic year are required.'
    return
  }

  saving.value = true
  try {
    const { data } = await api.post('/dos/classes', {
      class_name: form.class_name.trim(),
      academic_year: form.academic_year.trim(),
    })
    items.value.push(data)
    toast.success(`${data.class_name} was created.`)
    modalOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create the class.')
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
      title="Classes"
      subtitle="Organise your school into class groups by academic year."
    >
      <template #actions>
        <button class="btn btn-primary" @click="openModal">
          <Plus :size="16" />
          New class
        </button>
      </template>
    </PageHeader>

    <div class="summary-row">
      <div class="summary-pill">
        <span class="summary-icon"><School :size="17" /></span>
        <div>
          <strong>{{ items.length }}</strong>
          <span>classes</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon sky"><CalendarDays :size="17" /></span>
        <div>
          <strong>{{ academicYears }}</strong>
          <span>academic years</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon green"><Users :size="17" /></span>
        <div>
          <strong>{{ students.length }}</strong>
          <span>students placed</span>
        </div>
      </div>
      <div class="search toolbar-search">
        <Search :size="17" />
        <input
          v-model="search"
          class="input"
          type="search"
          placeholder="Search classes…"
        />
      </div>
    </div>

    <div v-if="loading" class="grid grid-3">
      <div v-for="n in 6" :key="n" class="card card-pad">
        <div class="skeleton" style="width: 44px; height: 44px" />
        <div class="skeleton" style="width: 55%; height: 16px; margin-top: 16px" />
        <div class="skeleton" style="width: 35%; height: 12px; margin-top: 9px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="card">
      <EmptyState
        title="No classes found"
        :message="
          search
            ? 'Try a different search term.'
            : 'Create your first class to start placing students.'
        "
        :icon="School"
      >
        <button v-if="!search" class="btn btn-primary" @click="openModal">
          <Plus :size="16" />
          Create a class
        </button>
      </EmptyState>
    </div>

    <div v-else class="grid grid-3">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="class-card card card-hover"
      >
        <div class="class-top">
          <span class="class-icon">
            <School :size="22" />
          </span>
          <span class="badge badge-primary">{{ item.academic_year }}</span>
        </div>
        <h3>{{ item.class_name }}</h3>
        <p class="class-meta">
          <Users :size="14" />
          {{ classStudents(item.id).length }} student{{
            classStudents(item.id).length === 1 ? '' : 's'
          }}
          <span class="dot">·</span>
          Class #{{ item.id }}
        </p>

        <div class="class-foot">
          <div class="avatar-stack">
            <AvatarBadge
              v-for="student in classStudents(item.id).slice(0, 3)"
              :key="student.id"
              :name="student.full_name"
              size="xs"
              soft
            />
            <span
              v-if="classStudents(item.id).length > 3"
              class="avatar-more"
            >
              +{{ classStudents(item.id).length - 3 }}
            </span>
            <span
              v-if="!classStudents(item.id).length"
              class="small muted"
            >
              No students placed yet
            </span>
          </div>
          <ArrowUpRight :size="16" class="class-arrow" />
        </div>
      </article>
    </div>

    <BaseModal
      v-model="modalOpen"
      title="Create a class"
      subtitle="Classes group students by name and academic year."
    >
      <form id="class-form" class="form-grid" @submit.prevent="submit">
        <div class="field">
          <label for="class_name">Class name</label>
          <input
            id="class_name"
            v-model="form.class_name"
            class="input"
            type="text"
            placeholder="e.g. Form 2 East"
            maxlength="100"
            required
          />
        </div>
        <div class="field">
          <label for="academic_year">Academic year</label>
          <input
            id="academic_year"
            v-model="form.academic_year"
            class="input"
            type="text"
            placeholder="e.g. 2026/2027"
            maxlength="20"
            required
          />
          <span class="hint">Use the year format your school follows.</span>
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
          form="class-form"
          :disabled="saving"
        >
          <span v-if="saving" class="spinner" />
          <template v-else>
            <Plus :size="16" />
            Create class
          </template>
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.summary-row {
  display: flex;
  align-items: center;
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

.summary-icon.green {
  background: var(--success-soft);
  color: var(--success);
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

.toolbar-search {
  margin-left: auto;
}

.class-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.class-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.class-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eef2ff, #e0f2fe);
  color: var(--primary-700);
  border: 1px solid #e5eaff;
}

.class-card h3 {
  font-size: 1.08rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-top: 4px;
}

.class-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: var(--muted);
  flex-wrap: wrap;
}

.class-meta svg {
  color: var(--muted-2);
}

.dot {
  color: var(--muted-2);
}

.class-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line-2);
}

.avatar-stack {
  display: flex;
  align-items: center;
}

.avatar-stack :deep(.avatar) {
  margin-right: -8px;
  box-shadow: 0 0 0 2px var(--surface);
}

.avatar-more {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-left: 2px;
  border-radius: 10px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--muted);
}

.class-arrow {
  color: var(--muted-2);
}

.class-card:hover .class-arrow {
  color: var(--primary);
}

@media (max-width: 560px) {
  .toolbar-search {
    margin-left: 0;
    max-width: none;
    width: 100%;
  }
}
</style>
