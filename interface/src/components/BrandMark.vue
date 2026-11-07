<script setup>
import { School } from 'lucide-vue-next'

defineProps({
  compact: { type: Boolean, default: false },
  light: { type: Boolean, default: false },
})
</script>

<template>
  <div class="brand" :class="{ 'brand-light': light, 'brand-compact': compact }">
    <span class="brand-mark">
      <School :size="compact ? 18 : 21" :stroke-width="2.2" />
    </span>
    <span v-if="!compact" class="brand-text">
      <strong>NewHope</strong>
      <small>School Portal</small>
    </span>
  </div>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--ink);
  min-width: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #4f46e5 55%, #0ea5e9);
  box-shadow: 0 10px 20px -10px rgba(79, 70, 229, 0.75);
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
  min-width: 0;
}

.brand-text strong {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.brand-text small {
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 3px;
}

.brand-light {
  color: #fff;
}

.brand-light .brand-text small {
  color: rgba(226, 232, 240, 0.62);
}

.brand-light .brand-mark {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: none;
  color: #c7d2fe;
}

.brand-compact .brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
}
</style>
