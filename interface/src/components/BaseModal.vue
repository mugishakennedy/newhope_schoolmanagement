<script setup>
import { onBeforeUnmount, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  size: { type: String, default: 'md' },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKeydown)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeydown)
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close">
        <div
          class="modal-card"
          :class="`modal-${size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="modal-head">
            <div>
              <h3 v-if="title">{{ title }}</h3>
              <p v-if="subtitle" class="modal-sub">{{ subtitle }}</p>
            </div>
            <button class="icon-btn modal-close" @click="close">
              <X :size="18" />
            </button>
          </header>

          <div class="modal-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 6vh 18px 30px;
  background: rgba(9, 15, 31, 0.5);
  backdrop-filter: blur(6px);
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 540px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: var(--shadow-lg);
  animation: pop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  margin-bottom: 6vh;
}

.modal-sm {
  max-width: 420px;
}

.modal-lg {
  max-width: 720px;
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 0;
}

.modal-head h3 {
  font-size: 1.16rem;
  font-weight: 800;
}

.modal-sub {
  margin-top: 5px;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.modal-close {
  flex-shrink: 0;
}

.modal-body {
  padding: 20px 24px 24px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 24px;
  border-top: 1px solid var(--line-2);
  background: var(--surface-2);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  flex-wrap: wrap;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-card {
  transform: translateY(-14px) scale(0.98);
}

@media (max-width: 560px) {
  .modal-backdrop {
    padding: 3vh 12px 20px;
  }

  .modal-head,
  .modal-body,
  .modal-foot {
    padding-left: 18px;
    padding-right: 18px;
  }

  .modal-foot .btn {
    flex: 1;
  }
}
</style>
