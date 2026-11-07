<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Clock3,
  FileCheck2,
  GraduationCap,
  Plus,
  School,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AvatarBadge from '@/components/AvatarBadge.vue'
import BarChart from '@/components/BarChart.vue'
import DonutChart from '@/components/DonutChart.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatCard from '@/components/StatCard.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import {
  formatDate,
  formatGrade,
  gradeTone,
  timeAgo,
} from '@/utils/format'

const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const stats = ref(null)
const assignments = ref([])
const submissions = ref([])
const students = ref([])
const classes = ref([])
const modules = ref([])
const teachers = ref([])

const firstName = computed(() => auth.displayName.split(' ')[0])
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const today = computed(() =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }),
)

const classMap = computed(
  () => new Map(classes.value.map((item) => [item.id, item])),
)
const moduleMap = computed(
  () => new Map(modules.value.map((item) => [item.id, item])),
)
const teacherMap = computed(
  () => new Map(teachers.value.map((item) => [item.id, item])),
)
const studentMap = computed(
  () => new Map(students.value.map((item) => [item.id, item])),
)
const assignmentMap = computed(
  () => new Map(assignments.value.map((item) => [item.id, item])),
)

const gradedCount = computed(() => {
  if (!stats.value) return 0
  return Math.max(
    0,
    stats.value.submissions - stats.value.ungraded_submissions,
  )
})

const recentAssignments = computed(() =>
  [...assignments.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5),
)

const recentSubmissions = computed(() =>
  [...submissions.value]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 5),
)

const chartItems = computed(() => {
  if (!stats.value) return []
  return [
    { label: 'Students', value: stats.value.students, color: '#4f46e5' },
    { label: 'Teachers', value: stats.value.teachers, color: '#0ea5e9' },
    { label: 'Classes', value: stats.value.classes, color: '#10b981' },
    { label: 'Modules', value: stats.value.modules, color: '#f59e0b' },
    { label: 'Assignments', value: stats.value.assignments, color: '#8b5cf6' },
    { label: 'Submissions', value: stats.value.submissions, color: '#ec4899' },
  ]
})

function className(id) {
  return classMap.value.get(id)?.class_name || `Class #${id}`
}

function moduleName(id) {
  return moduleMap.value.get(id)?.module_name || `Module #${id}`
}

function teacherName(id) {
  return teacherMap.value.get(id)?.full_name || `Teacher #${id}`
}

function studentName(id) {
  return studentMap.value.get(id)?.full_name || `Student #${id}`
}

function assignmentTitle(id) {
  return assignmentMap.value.get(id)?.title || `Assignment #${id}`
}

async function load() {
  loading.value = true
  try {
    const [
      statsRes,
      assignmentsRes,
      submissionsRes,
      studentsRes,
      classesRes,
      modulesRes,
      teachersRes,
    ] = await Promise.all([
      api.get('/dos/dashboard'),
      api.get('/dos/assignments'),
      api.get('/dos/submissions'),
      api.get('/dos/students'),
      api.get('/dos/classes'),
      api.get('/dos/modules'),
      api.get('/dos/teachers'),
    ])

    stats.value = statsRes.data
    assignments.value = assignmentsRes.data
    submissions.value = submissionsRes.data
    students.value = studentsRes.data
    classes.value = classesRes.data
    modules.value = modulesRes.data
    teachers.value = teachersRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load the dashboard.'))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <section class="hero">
      <div class="hero-glow" aria-hidden="true" />
      <div class="hero-copy">
        <span class="hero-eyebrow">
          <Sparkles :size="14" />
          {{ today }}
        </span>
        <h1>{{ greeting }}, {{ firstName }}.</h1>
        <p>
          Here is what is happening across NewHope today. Keep your school
          moving — one clear decision at a time.
        </p>
        <div class="hero-actions">
          <router-link to="/admin/assignments?new=1" class="btn btn-primary">
            <Plus :size="16" />
            New assignment
          </router-link>
          <router-link to="/admin/teachers?new=1" class="btn hero-ghost">
            <GraduationCap :size="16" />
            Add teacher
          </router-link>
        </div>
      </div>

      <div class="hero-aside">
        <div class="hero-metric">
          <span class="hero-metric-icon">
            <TrendingUp :size="18" />
          </span>
          <div>
            <strong>{{ stats?.ungraded_submissions ?? 0 }}</strong>
            <span>submissions waiting for a grade</span>
          </div>
        </div>
        <div class="hero-metric">
          <span class="hero-metric-icon sky">
            <CalendarClock :size="18" />
          </span>
          <div>
            <strong>{{ stats?.assignments ?? 0 }}</strong>
            <span>assignments across the school</span>
          </div>
        </div>
        <router-link to="/admin/submissions" class="hero-link">
          Open submissions queue
          <ArrowUpRight :size="15" />
        </router-link>
      </div>
    </section>

    <div class="grid grid-4">
      <template v-if="loading">
        <div v-for="n in 4" :key="n" class="card card-pad skeleton-card">
          <div class="skeleton" style="width: 42px; height: 42px" />
          <div class="skeleton" style="width: 64px; height: 28px; margin-top: 16px" />
          <div class="skeleton" style="width: 90px; height: 12px; margin-top: 10px" />
        </div>
      </template>
      <template v-else>
        <StatCard
          label="Students"
          :value="stats?.students ?? 0"
          :icon="Users"
          tone="primary"
          hint="Enrolled"
          to="/admin/students"
        />
        <StatCard
          label="Teachers"
          :value="stats?.teachers ?? 0"
          :icon="GraduationCap"
          tone="accent"
          hint="Faculty"
          to="/admin/teachers"
        />
        <StatCard
          label="Classes"
          :value="stats?.classes ?? 0"
          :icon="School"
          tone="success"
          hint="Active"
          to="/admin/classes"
        />
        <StatCard
          label="Modules"
          :value="stats?.modules ?? 0"
          :icon="BookOpen"
          tone="violet"
          hint="Curriculum"
          to="/admin/modules"
        />
      </template>
    </div>

    <div class="grid grid-3 workload-grid">
      <router-link to="/admin/assignments" class="workload-card card card-hover">
        <span class="workload-icon primary">
          <ClipboardList :size="20" />
        </span>
        <div>
          <strong>{{ stats?.assignments ?? 0 }}</strong>
          <span>Assignments created</span>
        </div>
        <ArrowUpRight :size="17" class="workload-arrow" />
      </router-link>
      <router-link to="/admin/submissions" class="workload-card card card-hover">
        <span class="workload-icon sky">
          <FileCheck2 :size="20" />
        </span>
        <div>
          <strong>{{ stats?.submissions ?? 0 }}</strong>
          <span>Submissions received</span>
        </div>
        <ArrowUpRight :size="17" class="workload-arrow" />
      </router-link>
      <router-link to="/admin/submissions" class="workload-card card card-hover">
        <span class="workload-icon amber">
          <Clock3 :size="20" />
        </span>
        <div>
          <strong>{{ stats?.ungraded_submissions ?? 0 }}</strong>
          <span>Awaiting grading</span>
        </div>
        <ArrowUpRight :size="17" class="workload-arrow" />
      </router-link>
    </div>

    <div class="grid insights-grid">
      <section class="card card-pad">
        <div class="card-head">
          <div>
            <h3>School at a glance</h3>
            <p class="small muted">Live counts across the platform</p>
          </div>
          <span class="badge badge-primary">
            <BarChart3 :size="13" />
            Overview
          </span>
        </div>
        <BarChart v-if="!loading" :items="chartItems" />
        <div v-else class="stack">
          <div v-for="n in 6" :key="n" class="skeleton" style="height: 14px" />
        </div>
      </section>

      <section class="card card-pad grading-card">
        <div class="card-head">
          <div>
            <h3>Grading progress</h3>
            <p class="small muted">Submitted work reviewed</p>
          </div>
        </div>
        <DonutChart
          :value="gradedCount"
          :total="stats?.submissions ?? 0"
          label="Graded"
          :caption="`${gradedCount} graded · ${stats?.ungraded_submissions ?? 0} pending`"
          color="#10b981"
        />
        <router-link to="/admin/submissions" class="btn btn-soft btn-block">
          Review submissions
        </router-link>
      </section>
    </div>

    <div class="grid recent-grid">
      <section class="card">
        <div class="card-head card-pad head-tight">
          <div>
            <h3>Recent assignments</h3>
            <p class="small muted">The latest work posted to classes</p>
          </div>
          <router-link to="/admin/assignments" class="link small">
            View all
          </router-link>
        </div>

        <div v-if="loading" class="card-pad">
          <div class="stack">
            <div v-for="n in 4" :key="n" class="skeleton" style="height: 46px" />
          </div>
        </div>
        <EmptyState
          v-else-if="!recentAssignments.length"
          title="No assignments yet"
          message="Create the first assignment to get your classes started."
          :icon="ClipboardList"
        />
        <div v-else class="list">
          <router-link
            v-for="item in recentAssignments"
            :key="item.id"
            to="/admin/assignments"
            class="list-row"
          >
            <span class="list-icon">
              <ClipboardList :size="17" />
            </span>
            <div class="list-main">
              <strong class="truncate">{{ item.title }}</strong>
              <span>
                {{ className(item.class_id) }} · {{ moduleName(item.module_id) }}
              </span>
            </div>
            <div class="list-side">
              <span class="badge" :class="item.deadline ? 'badge-warning' : ''">
                {{ item.deadline ? formatDate(item.deadline) : 'No deadline' }}
              </span>
              <small>{{ teacherName(item.teacher_id) }}</small>
            </div>
          </router-link>
        </div>
      </section>

      <section class="card">
        <div class="card-head card-pad head-tight">
          <div>
            <h3>Latest submissions</h3>
            <p class="small muted">Fresh work from your students</p>
          </div>
          <router-link to="/admin/submissions" class="link small">
            View all
          </router-link>
        </div>

        <div v-if="loading" class="card-pad">
          <div class="stack">
            <div v-for="n in 4" :key="n" class="skeleton" style="height: 46px" />
          </div>
        </div>
        <EmptyState
          v-else-if="!recentSubmissions.length"
          title="No submissions yet"
          message="Student submissions will appear here as they come in."
          :icon="FileCheck2"
        />
        <div v-else class="list">
          <div
            v-for="item in recentSubmissions"
            :key="item.id"
            class="list-row"
          >
            <AvatarBadge :name="studentName(item.student_id)" size="sm" soft />
            <div class="list-main">
              <strong class="truncate">
                {{ studentName(item.student_id) }}
              </strong>
              <span class="truncate">{{ assignmentTitle(item.assignment_id) }}</span>
            </div>
            <div class="list-side">
              <span
                v-if="item.grade !== null && item.grade !== undefined"
                class="badge"
                :class="`badge-${gradeTone(item.grade)}`"
              >
                {{ formatGrade(item.grade) }}
              </span>
              <span v-else class="badge badge-warning">Ungraded</span>
              <small>{{ timeAgo(item.submitted_at) }}</small>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 30px;
  padding: 34px 36px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #111a33 0%, #172a52 55%, #1b3a6b 100%);
  color: #e2e8f0;
  box-shadow: 0 40px 80px -50px rgba(15, 23, 42, 0.8);
}

.hero-glow {
  position: absolute;
  width: 380px;
  height: 380px;
  top: -160px;
  right: -80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.5), transparent 68%);
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
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.72rem;
  font-weight: 700;
  color: #c7d2fe;
}

.hero h1 {
  margin: 18px 0 10px;
  font-size: clamp(1.7rem, 2.7vw, 2.3rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  color: #fff;
}

.hero p {
  max-width: 480px;
  color: #a9b8d0;
  font-size: 0.92rem;
  line-height: 1.65;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.hero-ghost {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.16);
  color: #e2e8f0;
}

.hero-ghost:hover {
  background: rgba(255, 255, 255, 0.12);
}

.hero-aside {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: center;
  padding-left: 24px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.hero-metric {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
}

.hero-metric-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: rgba(129, 140, 248, 0.2);
  color: #c7d2fe;
  flex-shrink: 0;
}

.hero-metric-icon.sky {
  background: rgba(56, 189, 248, 0.18);
  color: #7dd3fc;
}

.hero-metric > div {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.hero-metric strong {
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
}

.hero-metric span {
  font-size: 0.7rem;
  color: #90a3c0;
  margin-top: 2px;
}

.hero-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #93c5fd;
  padding: 4px 12px;
}

.hero-link:hover {
  color: #bfdbfe;
}

.skeleton-card {
  box-shadow: var(--shadow-xs);
}

.workload-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.workload-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 17px 18px;
}

.workload-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  flex-shrink: 0;
}

.workload-icon.primary {
  background: var(--primary-soft);
  color: var(--primary-700);
}

.workload-icon.sky {
  background: var(--accent-soft);
  color: #0369a1;
}

.workload-icon.amber {
  background: var(--warning-soft);
  color: var(--warning);
}

.workload-card > div {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  flex: 1;
  min-width: 0;
}

.workload-card strong {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.workload-card span:not(.workload-icon) {
  font-size: 0.78rem;
  color: var(--muted);
  margin-top: 2px;
}

.workload-arrow {
  color: var(--muted-2);
  flex-shrink: 0;
}

.workload-card:hover .workload-arrow {
  color: var(--primary);
}

.insights-grid {
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
}

.recent-grid {
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

.grading-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: space-between;
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

@media (max-width: 1180px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-aside {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .hero-link {
    grid-column: span 2;
    padding: 4px 0;
  }

  .insights-grid,
  .recent-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .hero {
    padding: 26px 22px;
  }

  .hero-aside {
    grid-template-columns: 1fr;
  }

  .hero-link {
    grid-column: auto;
  }

  .workload-grid {
    grid-template-columns: 1fr;
  }
}
</style>
