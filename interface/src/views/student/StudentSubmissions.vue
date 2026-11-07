<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  MessageSquareQuote,
  Search,
  Timer,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
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
const modules = ref([])
const teachers = ref([])
const loading = ref(true)
const search = ref('')
const activeTab = ref('all')

const assignmentMap = computed(
  () => new Map(assignments.value.map((item) => [item.id, item])),
)
const moduleMap = computed(
  () => new Map(modules.value.map((item) => [item.id, item])),
)
const teacherMap = computed(
  () => new Map(teachers.value.map((item) => [item.id, item])),
)

function isGraded(item) {
  return item.grade !== null && item.grade !== undefined
}

const graded = computed(() => submissions.value.filter(isGraded))
const pending = computed(
  () => submissions.value.length - graded.value.length,
)

const averageGrade = computed(() => {
  if (!graded.value.length) return '—'
  const total = graded.value.reduce(
    (sum, item) => sum + toNumber(item.grade),
    0,
  )
  return `${(total / graded.value.length).toFixed(1)}%`
})

const tabs = computed(() => [
  { key: 'all', label: 'All', count: submissions.value.length },
  { key: 'graded', label: 'Graded', count: graded.value.length },
  { key: 'pending', label: 'Awaiting grade', count: pending.value },
])

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return [...submissions.value]
    .filter((item) => {
      if (activeTab.value === 'graded' && !isGraded(item)) return false
      if (activeTab.value === 'pending' && isGraded(item)) return false
      if (!term) return true
      return assignmentTitle(item.assignment_id)
        .toLowerCase()
        .includes(term)
    })
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
})

function assignmentTitle(id) {
  return assignmentMap.value.get(id)?.title || `Assignment #${id}`
}

function moduleName(id) {
  const assignment = assignmentMap.value.get(id)
  if (!assignment) return ''
  const module = moduleMap.value.get(assignment.module_id)
  return module ? `${module.module_code} · ${module.module_name}` : ''
}

function teacherName(id) {
  const assignment = assignmentMap.value.get(id)
  if (!assignment) return ''
  return teacherMap.value.get(assignment.teacher_id)?.full_name || ''
}

async function load() {
  loading.value = true
  try {
    const [submissionsRes, assignmentsRes, modulesRes, teachersRes] =
      await Promise.all([
        api.get('/students/me/submissions'),
        api.get('/students/me/assignments'),
        api.get('/public/modules'),
        api.get('/public/teachers'),
      ])
    submissions.value = submissionsRes.data
    assignments.value = assignmentsRes.data
    modules.value = modulesRes.data
    teachers.value = teachersRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load your submissions.'))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <PageHeader
      title="My submissions"
      subtitle="Track submitted work, grades and teacher feedback."
    >
      <template #actions>
        <router-link to="/student/assignments" class="btn btn-primary">
          <ClipboardList :size="16" />
          Go to assignments
        </router-link>
      </template>
    </PageHeader>

    <div class="summary-row">
      <div class="summary-pill">
        <span class="summary-icon"><FileCheck2 :size="17" /></span>
        <div>
          <strong>{{ submissions.length }}</strong>
          <span>submitted</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon green"><Award :size="17" /></span>
        <div>
          <strong>{{ graded.length }}</strong>
          <span>graded</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon amber"><Timer :size="17" /></span>
        <div>
          <strong>{{ pending }}</strong>
          <span>awaiting grade</span>
        </div>
      </div>
      <div class="summary-pill">
        <span class="summary-icon violet"><CheckCircle2 :size="17" /></span>
        <div>
          <strong>{{ averageGrade }}</strong>
          <span>average</span>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <div class="pill-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="tab-count">{{ tab.count }}</span>
        </button>
      </div>
      <div class="search">
        <Search :size="17" />
        <input
          v-model="search"
          class="input"
          type="search"
          placeholder="Search submissions…"
        />
      </div>
    </div>

    <div v-if="loading" class="grid grid-2">
      <div v-for="n in 4" :key="n" class="card card-pad">
        <div class="skeleton" style="width: 60%; height: 18px" />
        <div class="skeleton" style="width: 90%; height: 12px; margin-top: 12px" />
        <div class="skeleton" style="width: 45%; height: 12px; margin-top: 8px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="card">
      <EmptyState
        title="No submissions found"
        :message="
          search
            ? 'No submissions match your search.'
            : activeTab === 'pending'
              ? 'Nothing is waiting for a grade right now.'
              : 'Submit your first assignment and it will appear here.'
        "
        :icon="FileCheck2"
      >
        <router-link
          v-if="!submissions.length"
          to="/student/assignments"
          class="btn btn-primary"
        >
          <ClipboardList :size="16" />
          Browse assignments
        </router-link>
      </EmptyState>
    </div>

    <div v-else class="grid grid-2">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="submission-card card card-hover"
      >
        <div class="submission-top">
          <span class="submission-icon"><FileCheck2 :size="20" /></span>
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
            Awaiting grade
          </span>
        </div>

        <h3>{{ assignmentTitle(item.assignment_id) }}</h3>
        <p class="submission-meta">
          <span v-if="moduleName(item.assignment_id)">
            <BookOpen :size="13" />
            {{ moduleName(item.assignment_id) }}
          </span>
          <span v-if="teacherName(item.assignment_id)">
            · {{ teacherName(item.assignment_id) }}
          </span>
        </p>

        <div v-if="isGraded(item)" class="feedback-box">
          <span class="feedback-head">
            <MessageSquareQuote :size="14" />
            Teacher feedback
          </span>
          <p>{{ item.feedback || 'No written feedback was provided.' }}</p>
        </div>
        <div v-else class="pending-box">
          <Timer :size="15" />
          <span>
            Your work is in. Your teacher has not graded it yet — check back
            soon.
          </span>
        </div>

        <div class="submission-foot">
          <span class="small muted">
            Submitted {{ timeAgo(item.submitted_at) }} ·
            {{ formatDateTime(item.submitted_at) }}
          </span>
          <a
            :href="item.content_url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost btn-sm"
          >
            <ExternalLink :size="14" />
            Open work
          </a>
        </div>
      </article>
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

.toolbar {
  justify-content: space-between;
}

.toolbar .search {
  max-width: 320px;
}

.tab-count {
  display: inline-grid;
  place-items: center;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  margin-left: 5px;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.12);
  font-size: 0.66rem;
  font-weight: 800;
}

.pill-tabs button.active .tab-count {
  background: var(--primary-soft);
  color: var(--primary-700);
}

.submission-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.submission-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 3px;
}

.submission-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  color: #166534;
  border: 1px solid #d7f5e1;
}

.submission-card h3 {
  font-size: 1.04rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.submission-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  color: var(--muted);
  flex-wrap: wrap;
}

.submission-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.feedback-box,
.pending-box {
  margin-top: 5px;
  padding: 11px 13px;
  border-radius: 12px;
  font-size: 0.8rem;
  line-height: 1.5;
}

.feedback-box {
  background: var(--surface-2);
  border: 1px solid var(--line-2);
}

.feedback-head {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin-bottom: 5px;
}

.feedback-box p {
  color: var(--ink-2);
}

.pending-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--warning-soft);
  color: #854d0e;
  border: 1px solid #fde68a;
}

.pending-box svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.submission-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 7px;
  padding-top: 13px;
  border-top: 1px solid var(--line-2);
  flex-wrap: wrap;
}

@media (max-width: 760px) {
  .toolbar .search {
    max-width: none;
    width: 100%;
  }
}
</style>
