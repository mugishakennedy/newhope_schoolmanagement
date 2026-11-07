<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
})

const max = computed(() =>
  Math.max(1, ...props.items.map((item) => Number(item.value) || 0)),
)

function width(value) {
  return `${Math.max(4, (Number(value) || 0) / max.value * 100)}%`
}
</script>

<template>
  <div class="bars">
    <div v-for="item in items" :key="item.label" class="bar-row">
      <span class="bar-label">{{ item.label }}</span>
      <div class="bar-track">
        <span
          class="bar-fill"
          :style="{ width: width(item.value), background: item.color }"
        />
      </div>
      <span class="bar-value">{{ item.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.bars {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.bar-row {
  display: grid;
  grid-template-columns: 92px 1fr 40px;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
}

.bar-track {
  height: 10px;
  border-radius: 999px;
  background: var(--surface-3);
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.bar-value {
  text-align: right;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ink-2);
}

@media (max-width: 520px) {
  .bar-row {
    grid-template-columns: 74px 1fr 32px;
    gap: 9px;
  }
}
</style>
