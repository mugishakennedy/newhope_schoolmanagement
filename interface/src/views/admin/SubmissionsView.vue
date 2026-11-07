<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  Search,
  Send,
  Timer,
  UserRound,
  X,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AvatarBadge from '@/components/AvatarBadge.vue'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'
import {
  formatDateTime,
  formatGrade,
  gradeTone,
  timeAgo,
  toNumber,
} from '@/utils/format'

const toast = useToast()

const submissions = ref([])
const assignments = ref([])
const students = ref([])
const classes = ref([])
const loading = ref(true)
const saving = ref(false)
const modalOpen = ref(false)
const error = ref('')
const selected = ref(null)

const filters = reactive({
  search: '',
  assignment_id: '',
  status: '',
})

const gradeForm = reactive({
  grade: 0,
  feedback: '',
})

const assignmentMap = computed(
  () => new Map(assignments.value.map((item) => [item.id, item])),
)
const studentMap = computed(
  () => new Map(students.value.map((item) => [item.id, item])),
)
const classMap = computed(
  () => new Map(classes.value.map((item) => [item.id, item])),
)

const graded = computed(
  () =>
    submissions.value.filter(
      (item) => item.grade !== null && item.grade !== undefined,
    ).length,
)
const ungraded = computed(() => submissions.value.length - graded.value)
const averageGrade = computed(() => {
  const values = submissions.value
    .filter((item) => item.grade !== null && item.grade !== undefined)
    .map((item) => toNumber(item.grade))
  if (!values.length) return '—'
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  return `${avg.toFixed(1)}%`
})

const filtered = computed(() => {
  const term = filters.search.trim().toLowerCase()
  return submissions.value.filter((item) => {
    if (
      filters.assignment_id &&
      item.assignment_id !== Number(filters.assignment_id)
    ) {
      return false
    }
    const isGraded = item.grade !== null && item.grade !== undefined
    if (filters.status === 'graded' && !isGraded) return false
    if (filters.status === 'ungraded' && isGraded) return false
    if (term) {
      const student = studentMap.value.get(item.student_id)
      const assignment = assignmentMap.value.get(item.assignment_id)
      const haystack = [
        student?.full_name,
        student?.registration_no,
        assignment?.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(term)) return false
    }
    return true
  })
})

const hasFilters = computed(
  () => Boolean(filters.search || filters.assignment_id || filters.status),
)

function studentName(id) {
  return studentMap.value.get(id)?.full_name || `Student #${id}`
}

function studentReg(id) {
  return studentMap.value.get(id)?.registration_no || `#${id}`
}

function assignmentTitle(id) {
  return assignmentMap.value.get(id)?.title || `Assignment #${id}`
}

function assignmentClass(id) {
  const assignment = assignmentMap.value.get(id)
  if (!assignment) return ''
  return classMap.value.get(assignment.class_id)?.class_name || ''
}

function className(id) {
  return classMap.value.get(id)?.class_name || `Class #${id}`
}

function isGraded(item) {
  return item.grade !== null && item.grade !== undefined
}

function clearFilters() {
  filters.search = ''
  filters.assignment_id = ''
  filters.status = ''
}

async function load() {
  loading.value = true
  try {
    const [submissionsRes, assignmentsRes, studentsRes, classesRes] =
      await Promise.all([
        api.get('/dos/submissions'),
        api.get('/dos/assignments'),
        api.get('/dos/students'),
        api.get('/dos/classes'),
      ])
    submissions.value = submissionsRes.data
    assignments.value = assignmentsRes.data
    students.value = studentsRes.data
    classes.value = classesRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load submissions.'))
  } finally {
    loading.value = false
  }
}

function openGrade(item) {
  selected.value = item
  gradeForm.grade =
    item.grade !== null && item.grade !== undefined ? toNumber(item.grade) : 0
  gradeForm.feedback = item.feedback || ''
  error.value = ''
  modalOpen.value = true
}

function gradeColor() {
  const value = toNumber(gradeForm.grade)
  if (value >= 75) return 'var(--success)'
  if (value >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

async function saveGrade() {
  error.value = ''
  const grade = toNumber(gradeForm.grade, NaN)
  if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
    error.value = 'Grade must be between 0 and 100.'
    return
  }

  saving.value = true
  try {
    const { data } = await api.patch(
      `/dos/submissions/${selected.value.id}/grade`,
      {
        grade,
        feedback: gradeForm.feedback.trim() || null,
      },
    )
    const index = submissions.value.findIndex((item) => item.id === data.id)
    if (index !== -1) submissions.value.splice(index, 1, data)
    toast.success('Grade saved. The student can now see the feedback.')
    modalOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not save this grade.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <PageHeader
      title="Submissions"
      subtitle="Review student work, add feedback and release grades."
    />

    <div class="summary-row">
      <div class="summary-pill">
        <span class="summary-icon"><FileCheck2 :size="17" /></span>
        <div>
          <strong>{{ submissions.length }}</strong>
          <span>submissions</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon green"><CheckCircle2 :size="17" /></span>
        <div>
          <strong>{{ graded }}</strong>
          <span>graded</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon amber"><Timer :size="17" /></span>
        <div>
          <strong>{{ ungraded }}</strong>
          <span>awaiting grade</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon violet"><Award :size="17" /></span>
        <div>
          <strong>{{ averageGrade }}</strong>
          <span>average grade</span>
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
          placeholder="Search student or assignment…"
        />
      </div>
      <select v-model="filters.assignment_id" class="select select-compact">
        <option value="">All assignments</option>
        <option v-for="item in assignments" :key="item.id" :value="item.id">
          {{ item.title }}
        </option>
      </select>
      <select v-model="filters.status" class="select select-compact">
        <option value="">All statuses</option>
        <option value="ungraded">Awaiting grade</option>
        <option value="graded">Graded</option>
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

    <div v-if="loading" class="card card-pad">
      <div class="stack">
        <div v-for="n in 6" :key="n" class="skeleton" style="height: 54px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="card">
      <EmptyState
        title="No submissions found"
        :message="
          hasFilters
            ? 'Try adjusting your filters or search term.'
            : 'Submissions will appear here as students hand in their work.'
        "
        :icon="FileCheck2"
      >
        <button v-if="hasFilters" class="btn btn-ghost" @click="clearFilters">
          Clear filters
        </button>
      </EmptyState>
    </div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Assignment</th>
            <th>Submitted</th>
            <th>Score</th>
            <th class="right">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filtered"
            :key="item.id"
            :class="{ 'row-ungraded': !isGraded(item) }"
          >
            <td>
              <div class="cell-main">
                <AvatarBadge
                  :name="studentName(item.student_id)"
                  size="sm"
                  soft
                />
                <div>
                  <div class="cell-title">
                    {{ studentName(item.student_id) }}
                  </div>
                  <div class="cell-sub">
                    {{ studentReg(item.student_id) }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="cell-title">
                {{ assignmentTitle(item.assignment_id) }}
              </div>
              <div v-if="assignmentClass(item.assignment_id)" class="cell-sub">
                {{ assignmentClass(item.assignment_id) }}
              </div>
            </td>
            <td>
              <div class="cell-title small-strong">
                {{ timeAgo(item.submitted_at) }}
              </div>
              <div class="cell-sub">{{ formatDateTime(item.submitted_at) }}</div>
            </td>
            <td>
              <span
                v-if="isGraded(item)"
                class="badge"
                :class="`badge-${gradeTone(item.grade)}`"
              >
                <Award :size="12" />
                {{ formatGrade(item.grade) }}
              </span>
              <span v-else class="badge badge-warning">
                <Timer :size="12" />
                Ungraded
              </span>
            </td>
            <td>
              <div class="row-end">
                <a
                  :href="item.content_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-ghost btn-sm"
                  title="Open submitted work"
                >
                  <ExternalLink :size="14" />
                  View
                </a>
                <button class="btn btn-soft btn-sm" @click="openGrade(item)">
                  <Send :size="14" />
                  Grade
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal
      v-model="modalOpen"
      title="Grade submission"
      subtitle="Review the work, then give a score and helpful feedback."
    >
      <div v-if="selected" class="submission-preview">
        <div class="cell-main">
          <AvatarBadge
            :name="studentName(selected.student_id)"
            size="lg"
            soft
          />
          <div>
            <div class="cell-title">
              {{ studentName(selected.student_id) }}
            </div>
            <div class="cell-sub">
              {{ assignmentTitle(selected.assignment_id) }}
            </div>
            <div class="cell-sub">
              Submitted {{ formatDateTime(selected.submitted_at) }}
            </div>
          </div>
        </div>
        <a
          :href="selected.content_url"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-sm"
        >
          <ExternalLink :size="14" />
          Open work
        </a>
      </div>

      <form id="grade-form" class="form-grid" @submit.prevent="saveGrade">
        <div class="field">
          <div class="grade-head">
            <label for="grade">Grade</label>
            <strong :style="{ color: gradeColor() }">
              {{ toNumber(gradeForm.grade).toFixed(0) }}%
            </strong>
          </div>
          <input
            id="grade"
            v-model.number="gradeForm.grade"
            type="range"
            min="0"
            max="100"
            step="1"
            class="range"
          />
          <div class="range-labels">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
          <input
            v-model.number="gradeForm.grade"
            type="number"
            min="0"
            max="100"
            step="0.5"
            class="input grade-number"
          />
        </div>

        <div class="field">
          <label for="feedback">Feedback</label>
          <textarea
            id="feedback"
            v-model="gradeForm.feedback"
            class="textarea"
            placeholder="Share what was done well and what can improve…"
          />
          <span class="hint">
            Feedback is visible to the student once the grade is saved.
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
          form="grade-form"
          :disabled="saving"
        >
          <span v-if="saving" class="spinner" />
          <template v-else>
            <CheckCircle2 :size="16" />
            Save grade
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

.summary-icon.green {
  background: var(--success-soft);
  color: var(--success);
}

.summary-icon.amber {
  background: var(--warning-soft);
  color: var(--warning);
}

.summary-icon.violet {
  background: var(--violet-soft);
  color: var(--violet);
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

.filter-bar .search {
  max-width: 320px;
}

.right {
  text-align: right;
}

.row-end {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  flex-wrap: wrap;
}

.small-strong {
  font-size: 0.82rem;
  font-weight: 700;
}

.row-ungraded {
  background: #fffcf3;
}

.row-ungraded:hover {
  background: #fff8e7;
}

.submission-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.grade-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.grade-head strong {
  font-size: 1.1rem;
  font-weight: 800;
}

.range {
  width: 100%;
  height: 8px;
  margin: 6px 0 0;
  appearance: none;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--danger),
    var(--warning) 50%,
    var(--success)
  );
  outline: none;
}

.range::-webkit-slider-thumb {
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--primary);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}

.range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--primary);
  cursor: pointer;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  color: var(--muted-2);
  font-weight: 600;
  margin-top: 2px;
}

.grade-number {
  max-width: 130px;
  margin-top: 4px;
}

@media (max-width: 720px) {
  .table {
    min-width: 780px;
  }
}
</style>
