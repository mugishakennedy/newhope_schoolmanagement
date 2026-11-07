<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  Plus,
  Search,
} from 'lucide-vue-next'

import api, { apiErrorMessage } from '@/api/client'
import BaseModal from '@/components/BaseModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const toast = useToast()

const items = ref([])
const assignments = ref([])
const loading = ref(true)
const saving = ref(false)
const modalOpen = ref(false)
const search = ref('')
const error = ref('')

const form = reactive({
  module_code: '',
  module_name: '',
  description: '',
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return items.value
  return items.value.filter(
    (item) =>
      item.module_name.toLowerCase().includes(term) ||
      item.module_code.toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term),
  )
})

const assignmentCount = computed(() => {
  const map = new Map()
  for (const item of assignments.value) {
    map.set(item.module_id, (map.get(item.module_id) || 0) + 1)
  }
  return map
})

async function load() {
  loading.value = true
  try {
    const [modulesRes, assignmentsRes] = await Promise.all([
      api.get('/dos/modules'),
      api.get('/dos/assignments'),
    ])
    items.value = modulesRes.data
    assignments.value = assignmentsRes.data
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Could not load modules.'))
  } finally {
    loading.value = false
  }
}

function openModal() {
  error.value = ''
  form.module_code = ''
  form.module_name = ''
  form.description = ''
  modalOpen.value = true
}

async function submit() {
  error.value = ''
  if (!form.module_code.trim() || !form.module_name.trim()) {
    error.value = 'Module code and name are required.'
    return
  }

  saving.value = true
  try {
    const { data } = await api.post('/dos/modules', {
      module_code: form.module_code.trim().toUpperCase(),
      module_name: form.module_name.trim(),
      description: form.description.trim() || null,
    })
    items.value.push(data)
    toast.success(`${data.module_name} was added to the curriculum.`)
    modalOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Could not create the module.')
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
      title="Modules"
      subtitle="Manage the subjects and courses offered at NewHope."
    >
      <template #actions>
        <button class="btn btn-primary" @click="openModal">
          <Plus :size="16" />
          New module
        </button>
      </template>
    </PageHeader>

    <div class="toolbar">
      <div class="search">
        <Search :size="17" />
        <input
          v-model="search"
          class="input"
          type="search"
          placeholder="Search by name, code or description…"
        />
      </div>
      <span class="chip">
        <BookOpen :size="14" />
        {{ items.length }} module{{ items.length === 1 ? '' : 's' }}
      </span>
      <span class="chip">
        <ClipboardList :size="14" />
        {{ assignments.length }} assignment{{ assignments.length === 1 ? '' : 's' }}
      </span>
    </div>

    <div v-if="loading" class="grid grid-3">
      <div v-for="n in 6" :key="n" class="card card-pad">
        <div class="skeleton" style="width: 58px; height: 22px" />
        <div class="skeleton" style="width: 70%; height: 16px; margin-top: 16px" />
        <div class="skeleton" style="width: 92%; height: 12px; margin-top: 10px" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="card">
      <EmptyState
        title="No modules found"
        :message="
          search
            ? 'Try a different search term.'
            : 'Add the subjects your school teaches to get started.'
        "
        :icon="BookOpen"
      >
        <button v-if="!search" class="btn btn-primary" @click="openModal">
          <Plus :size="16" />
          Create a module
        </button>
      </EmptyState>
    </div>

    <div v-else class="grid grid-3">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="module-card card card-hover"
      >
        <div class="module-top">
          <span class="module-code">{{ item.module_code }}</span>
          <span class="badge">
            <ClipboardList :size="12" />
            {{ assignmentCount.get(item.id) || 0 }} assignments
          </span>
        </div>
        <h3>{{ item.module_name }}</h3>
        <p class="module-desc">
          {{ item.description || 'No description has been added for this module yet.' }}
        </p>
        <div class="module-foot">
          <span class="module-icon">
            <BookOpen :size="18" />
          </span>
          <span class="small muted">Module #{{ item.id }}</span>
        </div>
      </article>
    </div>

    <BaseModal
      v-model="modalOpen"
      title="Create a module"
      subtitle="Define a subject that teachers can be assigned to."
    >
      <form id="module-form" class="form-grid" @submit.prevent="submit">
        <div class="form-grid form-2">
          <div class="field">
            <label for="module_code">Module code</label>
            <input
              id="module_code"
              v-model="form.module_code"
              class="input"
              type="text"
              placeholder="e.g. MATH201"
              maxlength="50"
              required
            />
          </div>
          <div class="field">
            <label for="module_name">Module name</label>
            <input
              id="module_name"
              v-model="form.module_name"
              class="input"
              type="text"
              placeholder="e.g. Advanced Mathematics"
              maxlength="150"
              required
            />
          </div>
        </div>
        <div class="field">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            class="textarea"
            placeholder="What does this module cover?"
          />
          <span class="hint">Optional, but helpful for teachers and students.</span>
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
          form="module-form"
          :disabled="saving"
        >
          <span v-if="saving" class="spinner" />
          <template v-else>
            <Plus :size="16" />
            Create module
          </template>
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.module-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.module-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.module-code {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 8px;
  background: var(--ink);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.module-card h3 {
  font-size: 1.04rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-top: 2px;
}

.module-desc {
  font-size: 0.83rem;
  color: var(--muted);
  line-height: 1.55;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.module-foot {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 8px;
  padding-top: 13px;
  border-top: 1px solid var(--line-2);
}

.module-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--violet-soft);
  color: var(--violet);
}
</style>
