<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Hash,
  Mail,
  School,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AvatarBadge from '@/components/AvatarBadge.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import {
  formatDate,
  formatGrade,
  gradeTone,
  toNumber,
} from '@/utils/format'

const auth = useAuthStore()
const toast = useToast()

const classes = ref([])
const assignments = ref([])
const submissions = ref([])
const loading = ref(true)

const user = computed(() => auth.user || {})
const myClass = computed(() => {
  if (!user.value.class_id) return null
  return classes.value.find((item) => item.id === user.value.class_id) || null
})

const graded = computed(() =>
  submissions.value.filter(
    (item) => item.grade !== null && item.grade !== undefined,
  ),
)

const averageGrade = computed(() => {
  if (!graded.value.length) return '—'
  const total = graded.value.reduce(
    (sum, item) => sum + toNumber(item.grade),
    0,
  )
  return `${(total / graded.value.length).toFixed(1)}%`
})

const submittedCount = computed(() => submissions.value.length)
const progress = computed(() => {
  if (!assignments.value.length) return 0
  return Math.round((submittedCount.value / assignments.value.length) * 100)
})

async function load() {
  loading.value = true
  try {
    const [, classesRes, assignmentsRes, submissionsRes] = await Promise.all([
      auth.fetchMe(),
      api.get('/public/classes'),
      api.get('/students/me/assignments'),
      api.get('/students/me/submissions'),
    ])
    classes.value = classesRes.data
    assignments.value = assignmentsRes.data
    submissions.value = submissionsRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load your profile.'))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <PageHeader
      title="My profile"
      subtitle="Your student record and learning snapshot."
    />

    <section class="profile-hero card">
      <div class="profile-cover">
        <div class="cover-glow" aria-hidden="true" />
      </div>
      <div class="profile-body">
        <AvatarBadge :name="user.full_name" size="xl" />
        <div class="profile-id">
          <h2>{{ user.full_name }}</h2>
          <p>{{ user.email }}</p>
          <div class="profile-badges">
            <span class="badge badge-primary">
              <Hash :size="12" />
              {{ user.registration_no }}
            </span>
            <span v-if="myClass" class="badge badge-success">
              <School :size="12" />
              {{ myClass.class_name }}
            </span>
            <span v-else class="badge badge-warning">
              <School :size="12" />
              Not placed in a class
            </span>
            <span class="badge">
              <UserRound :size="12" />
              Student
            </span>
          </div>
        </div>
      </div>
    </section>

    <div class="grid profile-grid">
      <section class="card card-pad">
        <div class="card-head">
          <div>
            <h3>Student record</h3>
            <p class="small muted">Official details on your account</p>
          </div>
          <span class="badge badge-primary">
            <ShieldCheck :size="13" />
            Verified
          </span>
        </div>

        <dl class="detail-list">
          <div class="detail-row">
            <dt><UserRound :size="15" /> Full name</dt>
            <dd>{{ user.full_name || '—' }}</dd>
          </div>
          <div class="detail-row">
            <dt><Mail :size="15" /> Email address</dt>
            <dd>{{ user.email || '—' }}</dd>
          </div>
          <div class="detail-row">
            <dt><Hash :size="15" /> Registration number</dt>
            <dd>{{ user.registration_no || '—' }}</dd>
          </div>
          <div class="detail-row">
            <dt><School :size="15" /> Class</dt>
            <dd>{{ myClass?.class_name || 'Not placed yet' }}</dd>
          </div>
          <div class="detail-row">
            <dt><CalendarDays :size="15" /> Academic year</dt>
            <dd>{{ myClass?.academic_year || '—' }}</dd>
          </div>
          <div class="detail-row">
            <dt><GraduationCap :size="15" /> Joined</dt>
            <dd>{{ formatDate(user.created_at) }}</dd>
          </div>
        </dl>

        <p class="update-note">
          Need to correct something? Contact the Dean of Studies office — they
          manage student records.
        </p>
      </section>

      <div class="stack">
        <section class="card card-pad">
          <div class="card-head">
            <div>
              <h3>Learning snapshot</h3>
              <p class="small muted">Your progress this term</p>
            </div>
          </div>

          <div class="snapshot-grid">
            <div class="snapshot-card">
              <span class="snapshot-icon primary">
                <ClipboardList :size="18" />
              </span>
              <strong>{{ assignments.length }}</strong>
              <span>Assignments</span>
            </div>
            <div class="snapshot-card">
              <span class="snapshot-icon green">
                <CheckCircle2 :size="18" />
              </span>
              <strong>{{ submittedCount }}</strong>
              <span>Submitted</span>
            </div>
            <div class="snapshot-card">
              <span class="snapshot-icon violet">
                <Award :size="18" />
              </span>
              <strong>{{ graded.length }}</strong>
              <span>Graded</span>
            </div>
            <div class="snapshot-card">
              <span class="snapshot-icon amber">
                <GraduationCap :size="18" />
              </span>
              <strong>{{ averageGrade }}</strong>
              <span>Average</span>
            </div>
          </div>

          <div class="progress-block">
            <div class="spread">
              <span class="small strong">Submission progress</span>
              <span class="small muted">{{ progress }}%</span>
            </div>
            <div class="progress">
              <span :style="{ width: `${progress}%` }" />
            </div>
          </div>
        </section>

        <section class="card card-pad recent-card">
          <div class="card-head">
            <div>
              <h3>Latest result</h3>
              <p class="small muted">Most recent graded work</p>
            </div>
          </div>
          <div v-if="graded.length" class="latest">
            <span
              class="latest-grade"
              :class="`tone-${gradeTone(graded[0].grade)}`"
            >
              {{ formatGrade(graded[0].grade) }}
            </span>
            <div class="latest-main">
              <strong>
                {{
                  assignments.find(
                    (item) => item.id === graded[0].assignment_id,
                  )?.title || `Assignment #${graded[0].assignment_id}`
                }}
              </strong>
              <span>
                {{ graded[0].feedback || 'No written feedback.' }}
              </span>
            </div>
          </div>
          <p v-else class="small muted">
            No grades have been released yet. Keep up the good work!
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-hero {
  overflow: hidden;
}

.profile-cover {
  position: relative;
  height: 118px;
  background: linear-gradient(135deg, #1d2a55, #3b4d9e 55%, #3856b8);
}

.cover-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  top: -180px;
  right: 8%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.5), transparent 68%);
}

.profile-body {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  padding: 0 26px 24px;
  margin-top: -38px;
  position: relative;
  flex-wrap: wrap;
}

.profile-body :deep(.avatar) {
  border: 4px solid var(--surface);
  box-shadow: var(--shadow);
  background: linear-gradient(135deg, #eef2ff, #e0f2fe);
}

.profile-id {
  flex: 1;
  min-width: 0;
  padding-bottom: 2px;
}

.profile-id h2 {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.035em;
}

.profile-id p {
  color: var(--muted);
  font-size: 0.86rem;
  margin-top: 3px;
}

.profile-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 11px;
}

.profile-grid {
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.card-head h3 {
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.card-head p {
  margin-top: 4px;
}

.detail-list {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line-2);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row dt {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
}

.detail-row dt svg {
  color: var(--muted-2);
}

.detail-row dd {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: right;
  word-break: break-word;
}

.update-note {
  margin-top: 16px;
  padding: 11px 13px;
  border-radius: 11px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  font-size: 0.76rem;
  color: var(--muted);
  line-height: 1.5;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.snapshot-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 13px;
  border-radius: 13px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
}

.snapshot-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  margin-bottom: 6px;
}

.snapshot-icon.primary {
  background: var(--primary-soft);
  color: var(--primary-700);
}

.snapshot-icon.green {
  background: var(--success-soft);
  color: var(--success);
}

.snapshot-icon.violet {
  background: var(--violet-soft);
  color: var(--violet);
}

.snapshot-icon.amber {
  background: var(--warning-soft);
  color: var(--warning);
}

.snapshot-card strong {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.snapshot-card > span:last-child {
  font-size: 0.72rem;
  color: var(--muted);
  font-weight: 600;
}

.progress-block {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-card {
  flex: 1;
}

.latest {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.latest-grade {
  display: inline-grid;
  place-items: center;
  min-width: 56px;
  height: 46px;
  padding: 0 8px;
  border-radius: 13px;
  font-weight: 800;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.latest-grade.tone-success {
  background: var(--success-soft);
  color: var(--success);
}

.latest-grade.tone-warning {
  background: var(--warning-soft);
  color: var(--warning);
}

.latest-grade.tone-danger {
  background: var(--danger-soft);
  color: var(--danger);
}

.latest-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.latest-main strong {
  font-size: 0.86rem;
  font-weight: 700;
}

.latest-main span {
  font-size: 0.76rem;
  color: var(--muted);
  line-height: 1.45;
}

@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .profile-body {
    padding: 0 18px 20px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .detail-row dd {
    text-align: left;
  }
}
</style>
