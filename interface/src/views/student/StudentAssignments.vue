<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  AlertCircle,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Link as LinkIcon,
  Search,
  Send,
  Timer,
  Upload,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'
import {
  deadlineLabel,
  formatDateTime,
  formatGrade,
  gradeTone,
  isOverdue,
} from '@/utils/format'

const toast = useToast()

const assignments = ref([])
const submissions = ref([])
const modules = ref([])
const teachers = ref([])
const loading = ref(true)
const saving = ref(false)
const modalOpen = ref(false)
const error = ref('')
const search = ref('')
const activeTab = ref('all')
const selected = ref(null)

const form = reactive({
  content_url: '',
})

const moduleMap = computed(
  () => new Map(modules.value.map((item) => [item.id, item])),
)
const teacherMap = computed(
  () => new Map(teachers.value.map((item) => [item.id, item])),
)
const submissionMap = computed(
  () => new Map(submissions.value.map((item) => [item.assignment_id, item])),
)

function submissionFor(id) {
  return submissionMap.value.get(id)
}

function stateOf(item) {
  const submission = submissionFor(item.id)
  if (submission) {
    return submission.grade !== null && submission.grade !== undefined
      ? 'graded'
      : 'submitted'
  }
  return isOverdue(item.deadline) ? 'overdue' : 'pending'
}

const counts = computed(() => {
  const result = { all: assignments.value.length, pending: 0, submitted: 0, graded: 0, overdue: 0 }
  for (const item of assignments.value) {
    result[stateOf(item)] += 1
  }
  return result
})

const tabs = computed(() => [
  { key: 'all', label: 'All', count: counts.value.all },
  { key: 'pending', label: 'Pending', count: counts.value.pending },
  { key: 'submitted', label: 'Submitted', count: counts.value.submitted },
  { key: 'graded', label: 'Graded', count: counts.value.graded },
  { key: 'overdue', label: 'Overdue', count: counts.value.overdue },
])

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return [...assignments.value]
    .filter((item) => {
      if (activeTab.value !== 'all' && stateOf(item) !== activeTab.value) {
        return false
      }
      if (!term) return true
      return (
        item.title.toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term) ||
        moduleName(item.module_id).toLowerCase().includes(term) ||
        teacherName(item.teacher_id).toLowerCase().includes(term)
      )
    })
    .sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline) - new Date(b.deadline)
    })
})

function moduleCode(id) {
  return moduleMap.value.get(id)?.module_code || ''
}

function moduleName(id) {
  return moduleMap.value.get(id)?.module_name || `Module #${id}`
}

function teacherName(id) {
  return teacherMap.value.get(id)?.full_name || 'Teacher'
}

function statusMeta(item) {
  const state = stateOf(item)
  if (state === 'graded') {
    const submission = submissionFor(item.id)
    return {
      label: formatGrade(submission.grade),
      class: `badge badge-${gradeTone(submission.grade)}`,
      icon: Award,
    }
  }
  if (state === 'submitted') {
    return {
      label: 'Submitted',
      class: 'badge badge-info',
      icon: CheckCircle2,
    }
  }
  if (state === 'overdue') {
    return {
      label: 'Overdue',
      class: 'badge badge-danger',
      icon: AlertCircle,
    }
  }
  return {
    label: deadlineLabel(item.deadline),
    class: 'badge badge-warning',
    icon: Timer,
  }
}

function openSubmit(item) {
  selected.value = item
  const existing = submissionFor(item.id)
  form.content_url = existing?.content_url || ''
  error.value = ''
  modalOpen.value = true
}

async function submit() {
  error.value = ''
  const url = form.content_url.trim()
  if (!url) {
    error.value = 'Add a link to your submitted work.'
    return
  }

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      error.value = 'The link must start with http:// or https://.'
      return
    }
  } catch {
    error.value = 'Enter a valid URL, for example https://drive.google.com/…'
    return
  }

  saving.value = true
  try {
    const { data } = await api.post('/students/me/submissions', {
      assignment_id: selected.value.id,
      content_url: url,
    })
    const index = submissions.value.findIndex(
      (item) => item.assignment_id === data.assignment_id,
    )
    if (index === -1) {
      submissions.value.push(data)
    } else {
      submissions.value.splice(index, 1, data)
    }
    toast.success('Your work was submitted successfully.')
    modalOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not submit your work.')
  } finally {
    saving.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const [assignmentsRes, submissionsRes, modulesRes, teachersRes] =
      await Promise.all([
        api.get('/students/me/assignments'),
        api.get('/students/me/submissions'),
        api.get('/public/modules'),
        api.get('/public/teachers'),
      ])
    assignments.value = assignmentsRes.data
    submissions.value = submissionsRes.data
    modules.value = modulesRes.data
    teachers.value = teachersRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load your assignments.'))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <PageHeader
      title="Assignments"
      subtitle="Everything your class has been asked to complete."
    />

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
          placeholder="Search assignments…"
        />
      </div>
    </div>

    <div v-if="loading" class="grid grid-2">
      <div v-for="n in 4" :key="n" class="card card-pad">
        <div class="skeleton" style="width: 42px; height: 42px" />
        <div class="skeleton" style="width: 72%; height: 18px; margin-top: 16px" />
        <div class="skeleton" style="width: 94%; height: 12px; margin-top: 10px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="card">
      <EmptyState
        title="Nothing here"
        :message="
          search
            ? 'No assignments match your search.'
            : activeTab === 'all'
              ? 'Your class has no assignments yet. Check back soon.'
              : 'No assignments in this category right now.'
        "
        :icon="ClipboardList"
      />
    </div>

    <div v-else class="grid grid-2">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="assignment-card card card-hover"
        :class="`state-${stateOf(item)}`"
      >
        <div class="assignment-top">
          <span class="assignment-icon">
            <ClipboardList :size="20" />
          </span>
          <span :class="statusMeta(item).class">
            <component :is="statusMeta(item).icon" :size="12" />
            {{ statusMeta(item).label }}
          </span>
        </div>

        <h3>{{ item.title }}</h3>
        <p class="assignment-desc">
          {{ item.description || 'No instructions were added to this assignment.' }}
        </p>

        <div class="assignment-meta">
          <span class="chip">
            <BookOpen :size="13" />
            {{ moduleCode(item.module_id) || moduleName(item.module_id) }}
          </span>
          <span class="chip">{{ teacherName(item.teacher_id) }}</span>
          <span class="chip">
            <CalendarClock :size="13" />
            {{ item.deadline ? formatDateTime(item.deadline) : 'No deadline' }}
          </span>
        </div>

        <div class="assignment-foot">
          <span class="small muted">
            <template v-if="submissionFor(item.id)">
              Submitted {{ formatDateTime(submissionFor(item.id).submitted_at) }}
            </template>
            <template v-else>Not submitted yet</template>
          </span>
          <div class="row">
            <a
              v-if="submissionFor(item.id)"
              :href="submissionFor(item.id).content_url"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-ghost btn-sm"
            >
              <ExternalLink :size="14" />
              View
            </a>
            <button class="btn btn-primary btn-sm" @click="openSubmit(item)">
              <Upload :size="14" />
              {{ submissionFor(item.id) ? 'Resubmit' : 'Submit work' }}
            </button>
          </div>
        </div>

        <div
          v-if="
            submissionFor(item.id) &&
            submissionFor(item.id).grade !== null &&
            submissionFor(item.id).grade !== undefined
          "
          class="feedback-strip"
        >
          <Award :size="15" />
          <span>
            <strong>{{ formatGrade(submissionFor(item.id).grade) }}</strong>
            <template v-if="submissionFor(item.id).feedback">
              · {{ submissionFor(item.id).feedback }}
            </template>
            <template v-else> · No written feedback.</template>
          </span>
        </div>
      </article>
    </div>

    <BaseModal
      v-model="modalOpen"
      title="Submit your work"
      subtitle="Paste a shareable link to your document, file or folder."
    >
      <div v-if="selected" class="submit-summary">
        <div>
          <span class="small muted">Assignment</span>
          <strong>{{ selected.title }}</strong>
        </div>
        <div>
          <span class="small muted">Deadline</span>
          <strong>
            {{ selected.deadline ? formatDateTime(selected.deadline) : 'No deadline' }}
          </strong>
        </div>
      </div>

      <div
        v-if="selected && submissionFor(selected.id)"
        class="alert alert-info resubmit-note"
      >
        <AlertCircle :size="16" />
        <span>
          You already submitted this assignment. Submitting again will replace
          the previous link and reset any existing grade so your teacher can
          review the new work.
        </span>
      </div>

      <form id="submit-form" class="form-grid" @submit.prevent="submit">
        <div class="field">
          <label for="content_url">Link to your work</label>
          <div class="input-wrap">
            <input
              id="content_url"
              v-model="form.content_url"
              class="input with-icon"
              type="url"
              placeholder="https://drive.google.com/…"
              required
            />
            <LinkIcon :size="17" class="leading-icon" />
          </div>
          <span class="hint">
            Make sure the link is viewable by your teacher. Google Drive,
            OneDrive or Dropbox links work well.
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
          form="submit-form"
          :disabled="saving"
        >
          <span v-if="saving" class="spinner" />
          <template v-else>
            <Send :size="16" />
            Submit work
          </template>
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
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

.assignment-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.state-overdue {
  border-color: #fecaca;
}

.assignment-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 3px;
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

.state-overdue .assignment-icon {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: #fecaca;
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
  min-height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.assignment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
}

.assignment-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 7px;
  padding-top: 13px;
  border-top: 1px solid var(--line-2);
  flex-wrap: wrap;
}

.feedback-strip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 4px;
  padding: 10px 12px;
  border-radius: 11px;
  background: var(--success-soft);
  color: #166534;
  font-size: 0.76rem;
  line-height: 1.45;
}

.feedback-strip svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.submit-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 14px;
  border-radius: 13px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  margin-bottom: 14px;
}

.submit-summary > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.submit-summary strong {
  font-size: 0.86rem;
  font-weight: 700;
}

.resubmit-note {
  margin-bottom: 16px;
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

@media (max-width: 760px) {
  .toolbar .search {
    max-width: none;
    width: 100%;
  }

  .submit-summary {
    grid-template-columns: 1fr;
  }
}
</style>
