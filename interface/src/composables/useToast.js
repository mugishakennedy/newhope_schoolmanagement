import { reactive } from 'vue'

const state = reactive({ items: [] })
let nextId = 1

export function useToast() {
  function dismiss(id) {
    const index = state.items.findIndex((item) => item.id === id)
    if (index !== -1) state.items.splice(index, 1)
  }

  function notify(message, type = 'success', duration = 3800) {
    const id = nextId++
    state.items.push({ id, message, type })
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  return {
    toasts: state,
    notify,
    dismiss,
    success: (message) => notify(message, 'success'),
    error: (message) => notify(message, 'error', 5200),
    info: (message) => notify(message, 'info'),
  }
}
