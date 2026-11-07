<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: 0 },
  icon: { type: [Object, Function], required: true },
  tone: { type: String, default: 'primary' },
  hint: { type: String, default: '' },
  to: { type: [String, Object], default: '' },
})
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to || undefined"
    class="stat-card card"
    :class="{ 'stat-link': to }"
  >
    <div class="stat-top">
      <span class="stat-icon" :class="`tone-${tone}`">
        <component :is="icon" :size="20" :stroke-width="2.2" />
      </span>
      <span v-if="hint" class="stat-hint">{{ hint }}</span>
    </div>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
  </component>
</template>

<style scoped>
.stat-card {
  padding: 18px 18px 16px;
  box-shadow: var(--shadow-xs);
  transition: transform 0.2s ease, box-shadow 0.2s ease,
    border-color 0.2s ease;
  min-width: 0;
}

.stat-link:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
  border-color: #dbe3ef;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
}

.tone-primary {
  background: var(--primary-soft);
  color: var(--primary-700);
}

.tone-accent {
  background: var(--accent-soft);
  color: #0369a1;
}

.tone-success {
  background: var(--success-soft);
  color: var(--success);
}

.tone-warning {
  background: var(--warning-soft);
  color: var(--warning);
}

.tone-violet {
  background: var(--violet-soft);
  color: var(--violet);
}

.tone-danger {
  background: var(--danger-soft);
  color: var(--danger);
}

.stat-hint {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-2);
}

.stat-value {
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.stat-label {
  margin-top: 5px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted);
}
</style>
