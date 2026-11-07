<script setup>
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, School, Search, Users } from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import AvatarBadge from '@/components/AvatarBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()

const classes = ref([])
const students = ref([])
const loading = ref(true)
const search = ref('')

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

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return classes.value
  return classes.value.filter(
    (item) =>
      item.class_name.toLowerCase().includes(term) ||
      item.academic_year.toLowerCase().includes(term),
  )
})

function classStudents(id) {
  return studentsByClass.value.get(id) || []
}

async function load() {
  loading.value = true
  try {
    const [classesRes, studentsRes] = await Promise.all([
      api.get('/public/classes'),
      api.get('/students'),
    ])
    classes.value = classesRes.data
    students.value = studentsRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load classes.'))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <PageHeader
      title="Classes"
      subtitle="Explore every class group in the NewHope community."
    >
      <template #actions>
        <div class="search">
          <Search :size="17" />
          <input
            v-model="search"
            class="input"
            type="search"
            placeholder="Search classes…"
          />
        </div>
      </template>
    </PageHeader>

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
            : 'Classes will appear here once they are created.'
        "
        :icon="School"
      />
    </div>

    <div v-else class="grid grid-3">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="class-card card card-hover"
        :class="{ mine: auth.user?.class_id === item.id }"
      >
        <div class="class-top">
          <span class="class-icon"><School :size="22" /></span>
          <span
            v-if="auth.user?.class_id === item.id"
            class="badge badge-success"
          >
            My class
          </span>
          <span v-else class="badge badge-primary">{{ item.academic_year }}</span>
        </div>

        <h3>{{ item.class_name }}</h3>
        <p class="class-meta">
          <CalendarDays :size="14" />
          {{ item.academic_year }}
          <span class="dot">·</span>
          <Users :size="14" />
          {{ classStudents(item.id).length }} student{{
            classStudents(item.id).length === 1 ? '' : 's'
          }}
        </p>

        <div class="class-students">
          <AvatarBadge
            v-for="student in classStudents(item.id).slice(0, 5)"
            :key="student.id"
            :name="student.full_name"
            size="sm"
            soft
          />
          <span
            v-if="classStudents(item.id).length > 5"
            class="avatar-more"
          >
            +{{ classStudents(item.id).length - 5 }}
          </span>
          <span
            v-if="!classStudents(item.id).length"
            class="small muted"
          >
            No students placed yet
          </span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.class-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.class-card.mine {
  border-color: #bbf7d0;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
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

.class-students {
  display: flex;
  align-items: center;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line-2);
}

.class-students :deep(.avatar) {
  margin-right: -8px;
  box-shadow: 0 0 0 2px var(--surface);
}

.avatar-more {
  display: inline-grid;
  place-items: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  margin-left: 2px;
  border-radius: 10px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--muted);
}
</style>
