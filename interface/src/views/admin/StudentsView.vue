<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ExternalLink,
  School,
  Search,
  UserPlus,
  Users,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AvatarBadge from '@/components/AvatarBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/format'

const toast = useToast()

const students = ref([])
const classes = ref([])
const loading = ref(true)
const search = ref('')
const classFilter = ref('')

const classMap = computed(
  () => new Map(classes.value.map((item) => [item.id, item])),
)

const placed = computed(
  () => students.value.filter((item) => item.class_id !== null).length,
)
const unplaced = computed(() => students.value.length - placed.value)

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return students.value.filter((item) => {
    if (classFilter.value && item.class_id !== Number(classFilter.value)) {
      return false
    }
    if (!term) return true
    return (
      item.full_name.toLowerCase().includes(term) ||
      item.email.toLowerCase().includes(term) ||
      item.registration_no.toLowerCase().includes(term)
    )
  })
})

const hasFilters = computed(() => Boolean(search.value || classFilter.value))

function className(id) {
  if (id === null || id === undefined) return ''
  return classMap.value.get(id)?.class_name || `Class #${id}`
}

function classYear(id) {
  return classMap.value.get(id)?.academic_year || ''
}

function clearFilters() {
  search.value = ''
  classFilter.value = ''
}

async function load() {
  loading.value = true
  try {
    const [studentsRes, classesRes] = await Promise.all([
      api.get('/dos/students'),
      api.get('/dos/classes'),
    ])
    students.value = studentsRes.data
    classes.value = classesRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load students.'))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <PageHeader
      title="Students"
      subtitle="Everyone enrolled in your school, all in one place."
    >
      <template #actions>
        <a href="/register" target="_blank" class="btn btn-primary">
          <UserPlus :size="16" />
          Open registration
        </a>
      </template>
    </PageHeader>

    <div class="summary-row">
      <div class="summary-pill">
        <span class="summary-icon"><Users :size="17" /></span>
        <div>
          <strong>{{ students.length }}</strong>
          <span>students</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon green"><School :size="17" /></span>
        <div>
          <strong>{{ placed }}</strong>
          <span>placed in a class</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon amber"><UserPlus :size="17" /></span>
        <div>
          <strong>{{ unplaced }}</strong>
          <span>awaiting placement</span>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <div class="search">
        <Search :size="17" />
        <input
          v-model="search"
          class="input"
          type="search"
          placeholder="Search by name, email or registration number…"
        />
      </div>
      <select v-model="classFilter" class="select select-compact">
        <option value="">All classes</option>
        <option v-for="item in classes" :key="item.id" :value="item.id">
          {{ item.class_name }} · {{ item.academic_year }}
        </option>
      </select>
      <button
        v-if="hasFilters"
        class="btn btn-ghost btn-sm"
        @click="clearFilters"
      >
        Clear
      </button>
    </div>

    <div v-if="loading" class="card card-pad">
      <div class="stack">
        <div v-for="n in 6" :key="n" class="skeleton" style="height: 52px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="card">
      <EmptyState
        title="No students found"
        :message="
          hasFilters
            ? 'Try adjusting your filters or search term.'
            : 'Students will appear here after they register.'
        "
        :icon="Users"
      >
        <a href="/register" target="_blank" class="btn btn-primary">
          <ExternalLink :size="16" />
          Share registration link
        </a>
      </EmptyState>
    </div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Registration no.</th>
            <th>Class</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in filtered" :key="student.id">
            <td>
              <div class="cell-main">
                <AvatarBadge :name="student.full_name" soft />
                <div>
                  <div class="cell-title">{{ student.full_name }}</div>
                  <div class="cell-sub">{{ student.email }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="badge badge-primary">
                {{ student.registration_no }}
              </span>
            </td>
            <td>
              <template v-if="student.class_id !== null">
                <div class="cell-title small-strong">
                  {{ className(student.class_id) }}
                </div>
                <div v-if="classYear(student.class_id)" class="cell-sub">
                  {{ classYear(student.class_id) }}
                </div>
              </template>
              <span v-else class="badge badge-warning">
                <School :size="12" />
                Not placed
              </span>
            </td>
            <td class="small muted">{{ formatDate(student.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
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

.summary-icon.green {
  background: var(--success-soft);
  color: var(--success);
}

.summary-icon.amber {
  background: var(--warning-soft);
  color: var(--warning);
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

.small-strong {
  font-size: 0.84rem;
  font-weight: 700;
}

@media (max-width: 720px) {
  .table {
    min-width: 700px;
  }
}
</style>
