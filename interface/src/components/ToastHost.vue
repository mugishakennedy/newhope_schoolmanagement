<script setup>
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-vue-next'

import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-host">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts.items"
          :key="toast.id"
          class="toast"
          :class="`toast-${toast.type}`"
          role="status"
        >
          <span class="toast-icon">
            <component :is="icons[toast.type] || Info" :size="19" />
          </span>
          <p>{{ toast.message }}</p>
          <button class="toast-close" @click="dismiss(toast.id)">
            <X :size="15" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(380px, calc(100vw - 32px));
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 13px 14px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.toast p {
  flex: 1;
  font-size: 0.86rem;
  font-weight: 500;
  line-height: 1.45;
  padding-top: 1px;
}

.toast-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  flex-shrink: 0;
}

.toast-success .toast-icon {
  background: var(--success-soft);
  color: var(--success);
}

.toast-error .toast-icon {
  background: var(--danger-soft);
  color: var(--danger);
}

.toast-info .toast-icon {
  background: var(--accent-soft);
  color: #0369a1;
}

.toast-close {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--muted-2);
  flex-shrink: 0;
}

.toast-close:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(28px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(28px) scale(0.96);
}
</style>
