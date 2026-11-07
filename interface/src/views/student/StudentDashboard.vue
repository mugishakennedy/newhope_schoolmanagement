<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  School,
  Sparkles,
  Timer,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AvatarBadge from '@/components/AvatarBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatCard from '@/components/StatCard.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import {
  daysUntil,
  deadlineLabel,
  formatDate,
  formatDateTime,
  formatGrade,
  gradeTone,
  isOverdue,
  timeAgo,
  toNumber,
} from '@/utils/format'

const auth = useAuthStore()
const toast = useToast()

const assignments = ref([])
const submissions = ref([])
const classes = ref([])
const modules = ref([])
const teachers = ref([])
const loading = ref(true)

const user = computed(() => auth.user || {})
const firstName = computed(() =>
  (user.value.full_name || 'there').split(' ')[0],
)
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const classMap = computed(
  () => new Map(classes.value.map((item) => [item.id, item])),
)
const moduleMap = computed(
  () => new Map(modules.value.map((item) => [item.id, item])),
)
const teacherMap = computed(
  () => new Map(teachers.value.map((item) => [item.id, item])),
)
const submissionMap = computed(
  () => new Map(submissions.value.map((item) => [item.assignment_id, item])),
)

const myClass = computed(() =>
  user.value.class_id ? classMap.value.get(user.value.class_id) : null,
)

const gradedSubmissions = computed(() =>
  submissions.value.filter(
    (item) => item.grade !== null && item.grade !== undefined,
  ),
)

const averageGrade = computed(() => {
  if (!gradedSubmissions.value.length) return '—'
  const total = gradedSubmissions.value.reduce(
    (sum, item) => sum + toNumber(item.grade),
    0,
  )
  return `${(total / gradedSubmissions.value.length).toFixed(1)}%`
})

const submittedCount = computed(
  () =>
    assignments.value.filter((item) => submissionMap.value.has(item.id))
      .length,
)

const progress = computed(() => {
  if (!assignments.value.length) return 0
  return Math.round((submittedCount.value / assignments.value.length) * 100)
})

const upcoming = computed(() =>
  [...assignments.value]
    .filter((item) => {
      if (submissionMap.value.has(item.id)) return false
      const days = daysUntil(item.deadline)
      return days === null || days >= 0
    })
    .sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline) - new Date(b.deadline)
    })
    .slice(0, 4),
)

const overdue = computed(() =>
  assignments.value.filter(
    (item) => !submissionMap.value.has(item.id) && isOverdue(item.deadline),
  ),
)

const recentGrades = computed(() =>
  [...gradedSubmissions.value]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 4),
)

function moduleName(id) {
  return moduleMap.value.get(id)?.module_name || `Module #${id}`
}

function moduleCode(id) {
  return moduleMap.value.get(id)?.module_code || ''
}

function teacherName(id) {
  return teacherMap.value.get(id)?.full_name || 'Teacher'
}

function assignmentTitle(id) {
  return (
    assignments.value.find((item) => item.id === id)?.title ||
    `Assignment #${id}`
  )
}

function deadlineTone(item) {
  if (!item.deadline) return 'badge'
  const days = daysUntil(item.deadline)
  if (days !== null && days <= 2) return 'badge badge-warning'
  return 'badge badge-info'
}

async function load() {
  loading.value = true
  try {
    const [assignmentsRes, submissionsRes, classesRes, modulesRes, teachersRes] =
      await Promise.all([
        api.get('/students/me/assignments'),
        api.get('/students/me/submissions'),
        api.get('/public/classes'),
        api.get('/public/modules'),
        api.get('/public/teachers'),
      ])
    assignments.value = assignmentsRes.data
    submissions.value = submissionsRes.data
    classes.value = classesRes.data
    modules.value = modulesRes.data
    teachers.value = teachersRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load your dashboard.'))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <section class="student-hero">
      <div class="hero-glow" aria-hidden="true" />
      <div class="hero-copy">
        <span class="hero-eyebrow">
          <Sparkles :size="14" />
          {{ greeting }}
        </span>
        <h1>{{ firstName }}, ready to learn?</h1>
        <p v-if="myClass">
          You are in <strong>{{ myClass.class_name }}</strong> ·
          {{ myClass.academic_year }}. Keep up the great work.
        </p>
        <p v-else>
          Your class has not been assigned yet. Reach out to the Dean of
          Studies office so they can place you.
        </p>

        <div class="hero-actions">
          <router-link to="/student/assignments" class="btn btn-primary">
            Browse assignments
            <ArrowRight :size="16" />
          </router-link>
          <router-link to="/student/submissions" class="btn hero-ghost">
            My submissions
          </router-link>
        </div>
      </div>

      <div class="hero-progress">
        <div class="progress-card">
          <div class="progress-head">
            <span class="progress-icon">
              <CheckCircle2 :size="18" />
            </span>
            <span>Submission progress</span>
          </div>
          <strong>{{ progress }}%</strong>
          <p>
            {{ submittedCount }} of {{ assignments.length }} assignment{{
              assignments.length === 1 ? '' : 's'
            }}
            submitted
          </p>
          <div class="progress">
            <span :style="{ width: `${progress}%` }" />
          </div>
          <router-link to="/student/assignments" class="progress-link">
            View pending work
            <ArrowUpRight :size="14" />
          </router-link>
        </div>
      </div>
    </section>

    <div class="grid grid-4">
      <template v-if="loading">
        <div v-for="n in 4" :key="n" class="card card-pad">
          <div class="skeleton" style="width: 42px; height: 42px" />
          <div class="skeleton" style="width: 64px; height: 28px; margin-top: 16px" />
          <div class="skeleton" style="width: 90px; height: 12px; margin-top: 10px" />
        </div>
      </template>
      <template v-else>
        <StatCard
          label="Assignments"
          :value="assignments.length"
          :icon="ClipboardList"
          tone="primary"
          hint="This class"
          to="/student/assignments"
        />
        <StatCard
          label="Submitted"
          :value="submittedCount"
          :icon="CheckCircle2"
          tone="success"
          hint="Completed"
          to="/student/submissions"
        />
        <StatCard
          label="Awaiting grade"
          :value="submittedCount - gradedSubmissions.length"
          :icon="Timer"
          tone="warning"
          hint="In review"
          to="/student/submissions"
        />
        <StatCard
          label="Average grade"
          :value="averageGrade"
          :icon="Award"
          tone="violet"
          hint="Graded work"
          to="/student/submissions"
        />
      </template>
    </div>

    <div v-if="overdue.length" class="alert alert-error overdue-note">
      <CalendarClock :size="18" />
      <span>
        You have <strong>{{ overdue.length }}</strong>
        overdue assignment{{ overdue.length === 1 ? '' : 's' }}. Submit as soon
        as possible or contact your teacher.
        <router-link to="/student/assignments" class="link">
          Review overdue work
        </router-link>
      </span>
    </div>

    <div class="grid dashboard-grid">
      <section class="card">
        <div class="card-head card-pad head-tight">
          <div>
            <h3>Upcoming deadlines</h3>
            <p class="small muted">Work still waiting for you</p>
          </div>
          <router-link to="/student/assignments" class="link small">
            View all
          </router-link>
        </div>

        <div v-if="loading" class="card-pad">
          <div class="stack">
            <div v-for="n in 4" :key="n" class="skeleton" style="height: 52px" />
          </div>
        </div>
        <EmptyState
          v-else-if="!upcoming.length"
          title="All caught up"
          message="There are no pending assignments with upcoming deadlines."
          :icon="CheckCircle2"
        >
          <router-link to="/student/assignments" class="btn btn-soft btn-sm">
            Browse assignments
          </router-link>
        </EmptyState>
        <div v-else class="list">
          <router-link
            v-for="item in upcoming"
            :key="item.id"
            to="/student/assignments"
            class="list-row"
          >
            <span class="list-icon">
              <ClipboardList :size="17" />
            </span>
            <div class="list-main">
              <strong class="truncate">{{ item.title }}</strong>
              <span class="truncate">
                {{ moduleCode(item.module_id) || moduleName(item.module_id) }}
                · {{ teacherName(item.teacher_id) }}
              </span>
            </div>
            <div class="list-side">
              <span :class="deadlineTone(item)">
                {{ deadlineLabel(item.deadline) }}
              </span>
              <small>
                {{ item.deadline ? formatDate(item.deadline) : 'No deadline' }}
              </small>
            </div>
          </router-link>
        </div>
      </section>

      <section class="card">
        <div class="card-head card-pad head-tight">
          <div>
            <h3>Recent grades</h3>
            <p class="small muted">Feedback from your teachers</p>
          </div>
          <router-link to="/student/submissions" class="link small">
            View all
          </router-link>
        </div>

        <div v-if="loading" class="card-pad">
          <div class="stack">
            <div v-for="n in 4" :key="n" class="skeleton" style="height: 52px" />
          </div>
        </div>
        <EmptyState
          v-else-if="!recentGrades.length"
          title="No grades yet"
          message="Once your teacher grades a submission, the result will appear here."
          :icon="Award"
        />
        <div v-else class="list">
          <div v-for="item in recentGrades" :key="item.id" class="list-row">
            <span class="grade-bubble" :class="`tone-${gradeTone(item.grade)}`">
              {{ formatGrade(item.grade) }}
            </span>
            <div class="list-main">
              <strong class="truncate">
                {{ assignmentTitle(item.assignment_id) }}
              </strong>
              <span class="truncate">
                {{ item.feedback || 'No written feedback.' }}
              </span>
            </div>
            <div class="list-side">
              <small>{{ timeAgo(item.submitted_at) }}</small>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="grid grid-3 quick-grid">
      <router-link to="/student/assignments" class="quick-card card card-hover">
        <span class="quick-icon primary"><ClipboardList :size="20" /></span>
        <div>
          <strong>Assignments</strong>
          <span>See what is due next</span>
        </div>
        <ArrowUpRight :size="17" class="quick-arrow" />
      </router-link>
      <router-link to="/student/classes" class="quick-card card card-hover">
        <span class="quick-icon sky"><School :size="20" /></span>
        <div>
          <strong>Class directory</strong>
          <span>Explore school classes</span>
        </div>
        <ArrowUpRight :size="17" class="quick-arrow" />
      </router-link>
      <router-link to="/student/profile" class="quick-card card card-hover">
        <span class="quick-icon violet"><GraduationCap :size="20" /></span>
        <div>
          <strong>My profile</strong>
          <span>Your student record</span>
        </div>
        <ArrowUpRight :size="17" class="quick-arrow" />
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.student-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 30px;
  padding: 34px 36px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #1d2a55 0%, #2f3f8f 55%, #3856b8 100%);
  color: #e2e8f0;
  box-shadow: 0 40px 80px -50px rgba(15, 23, 42, 0.8);
}

.hero-glow {
  position: absolute;
  width: 360px;
  height: 360px;
  top: -160px;
  right: -70px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.45), transparent 68%);
  filter: blur(10px);
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 0.72rem;
  font-weight: 700;
  color: #dbeafe;
}

.student-hero h1 {
  margin: 18px 0 10px;
  font-size: clamp(1.7rem, 2.7vw, 2.3rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  color: #fff;
}

.student-hero p {
  max-width: 470px;
  color: #b7c6e0;
  font-size: 0.92rem;
  line-height: 1.65;
}

.student-hero p strong {
  color: #fff;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.hero-ghost {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.18);
  color: #e2e8f0;
}

.hero-ghost:hover {
  background: rgba(255, 255, 255, 0.14);
}

.hero-progress {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
}

.progress-card {
  width: 100%;
  padding: 20px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: var(--shadow-lg);
  color: var(--ink);
}

.progress-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--muted);
}

.progress-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--success-soft);
  color: var(--success);
}

.progress-card > strong {
  display: block;
  margin: 12px 0 2px;
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
}

.progress-card p {
  color: var(--muted);
  font-size: 0.76rem;
  margin-bottom: 12px;
}

.progress-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--primary-600);
}

.overdue-note {
  align-items: flex-start;
}

.overdue-note a {
  margin-left: 4px;
}

.dashboard-grid {
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
}

.head-tight {
  margin-bottom: 0;
}

.card-head h3 {
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.card-head p {
  margin-top: 4px;
}

.list {
  display: flex;
  flex-direction: column;
  padding: 4px 10px 12px;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 12px;
  transition: background 0.16s ease;
}

.list-row:hover {
  background: var(--surface-2);
}

.list-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--primary-soft);
  color: var(--primary-700);
  flex-shrink: 0;
}

.list-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  line-height: 1.3;
}

.list-main strong {
  font-size: 0.86rem;
  font-weight: 700;
}

.list-main span {
  font-size: 0.74rem;
  color: var(--muted);
  margin-top: 2px;
}

.list-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.list-side small {
  font-size: 0.68rem;
  color: var(--muted-2);
}

.grade-bubble {
  display: inline-grid;
  place-items: center;
  min-width: 46px;
  height: 38px;
  padding: 0 8px;
  border-radius: 11px;
  font-size: 0.78rem;
  font-weight: 800;
  flex-shrink: 0;
}

.grade-bubble.tone-success {
  background: var(--success-soft);
  color: var(--success);
}

.grade-bubble.tone-warning {
  background: var(--warning-soft);
  color: var(--warning);
}

.grade-bubble.tone-danger {
  background: var(--danger-soft);
  color: var(--danger);
}

.quick-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 16px 18px;
}

.quick-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex-shrink: 0;
}

.quick-icon.primary {
  background: var(--primary-soft);
  color: var(--primary-700);
}

.quick-icon.sky {
  background: var(--accent-soft);
  color: #0369a1;
}

.quick-icon.violet {
  background: var(--violet-soft);
  color: var(--violet);
}

.quick-card > div {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.3;
}

.quick-card strong {
  font-size: 0.88rem;
  font-weight: 800;
}

.quick-card span:not(.quick-icon) {
  font-size: 0.74rem;
  color: var(--muted);
  margin-top: 1px;
}

.quick-arrow {
  color: var(--muted-2);
}

.quick-card:hover .quick-arrow {
  color: var(--primary);
}

@media (max-width: 1080px) {
  .student-hero {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .student-hero {
    padding: 26px 22px;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
