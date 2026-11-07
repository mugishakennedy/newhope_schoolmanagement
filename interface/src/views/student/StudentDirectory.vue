<script setup>
import { computed, onMounted, ref } from 'vue'
import { Mail, Search, School, Users } from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AvatarBadge from '@/components/AvatarBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()

const students = ref([])
const classes = ref([])
const loading = ref(true)
const search = ref('')
const classFilter = ref('')

const classMap = computed(
  () => new Map(classes.value.map((item) => [item.id, item])),
)

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return students.value
    .filter((item) => {
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
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
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
      api.get('/students'),
      api.get('/public/classes'),
    ])
    students.value = studentsRes.data
    classes.value = classesRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load the student directory.'))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <PageHeader
      title="Student directory"
      subtitle="Find and connect with fellow students across the school."
    >
      <template #actions>
        <span class="chip">
          <Users :size="14" />
          {{ students.length }} student{{ students.length === 1 ? '' : 's' }}
        </span>
      </template>
    </PageHeader>

    <div class="toolbar">
      <div class="search">
        <Search :size="17" />
        <input
          v-model="search"
          class="input"
          type="search"
          placeholder="Search by name, email or registration…"
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

    <div v-if="loading" class="grid grid-3">
      <div v-for="n in 6" :key="n" class="card card-pad">
        <div class="skeleton" style="width: 52px; height: 52px; border-radius: 15px" />
        <div class="skeleton" style="width: 65%; height: 16px; margin-top: 14px" />
        <div class="skeleton" style="width: 85%; height: 12px; margin-top: 9px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="card">
      <EmptyState
        title="No students found"
        :message="
          hasFilters
            ? 'Try adjusting your search or class filter.'
            : 'The directory is empty right now.'
        "
        :icon="Users"
      >
        <button v-if="hasFilters" class="btn btn-ghost" @click="clearFilters">
          Clear filters
        </button>
      </EmptyState>
    </div>

    <div v-else class="grid grid-3">
      <article
        v-for="student in filtered"
        :key="student.id"
        class="person-card card card-hover"
        :class="{ me: student.id === auth.user?.id }"
      >
        <div class="person-top">
          <AvatarBadge :name="student.full_name" size="lg" soft />
          <span v-if="student.id === auth.user?.id" class="badge badge-success">
            You
          </span>
          <span v-else-if="className(student.class_id)" class="badge badge-primary">
            {{ className(student.class_id) }}
          </span>
          <span v-else class="badge badge-warning">No class</span>
        </div>

        <h3>{{ student.full_name }}</h3>
        <p class="person-reg">{{ student.registration_no }}</p>

        <div class="person-details">
          <span class="person-line">
            <Mail :size="13" />
            <span class="truncate">{{ student.email }}</span>
          </span>
          <span v-if="className(student.class_id)" class="person-line">
            <School :size="13" />
            <span class="truncate">
              {{ className(student.class_id) }}
              <template v-if="classYear(student.class_id)">
                · {{ classYear(student.class_id) }}
              </template>
            </span>
          </span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.person-card {
  padding: 20px;
}

.person-card.me {
  border-color: #bbf7d0;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
}

.person-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 13px;
}

.person-card h3 {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.person-reg {
  font-size: 0.76rem;
  color: var(--primary-600);
  font-weight: 700;
  margin-top: 3px;
}

.person-details {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid var(--line-2);
}

.person-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: var(--muted);
  min-width: 0;
}

.person-line svg {
  color: var(--muted-2);
  flex-shrink: 0;
}
</style>
