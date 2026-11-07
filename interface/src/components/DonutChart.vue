<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  label: { type: String, default: 'Completed' },
  caption: { type: String, default: '' },
  color: { type: String, default: '#4f46e5' },
})

const radius = 44
const circumference = 2 * Math.PI * radius

const percent = computed(() => {
  if (!props.total) return 0
  return Math.min(100, Math.max(0, (props.value / props.total) * 100))
})

const dashOffset = computed(
  () => circumference - (percent.value / 100) * circumference,
)
</script>

<template>
  <div class="donut-wrap">
    <div class="donut">
      <svg viewBox="0 0 120 120" role="img" :aria-label="`${label}: ${Math.round(percent)}%`">
        <circle class="donut-track" cx="60" cy="60" :r="radius" />
        <circle
          class="donut-value"
          cx="60"
          cy="60"
          :r="radius"
          :stroke="color"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
      <div class="donut-center">
        <strong>{{ Math.round(percent) }}%</strong>
        <span>{{ label }}</span>
      </div>
    </div>
    <p v-if="caption" class="donut-caption">{{ caption }}</p>
  </div>
</template>

<style scoped>
.donut-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.donut {
  position: relative;
  width: 150px;
  height: 150px;
}

svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

circle {
  fill: none;
  stroke-width: 12;
  stroke-linecap: round;
}

.donut-track {
  stroke: var(--surface-3);
}

.donut-value {
  transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
}

.donut-center strong {
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.donut-center span {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--muted);
  font-weight: 700;
}

.donut-caption {
  font-size: 0.8rem;
  color: var(--muted);
  text-align: center;
  line-height: 1.5;
}
</style>
