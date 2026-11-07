<script setup>
import { Inbox } from 'lucide-vue-next'

defineProps({
  title: { type: String, default: 'Nothing here yet' },
  message: { type: String, default: '' },
  icon: { type: [Object, Function], default: () => Inbox },
})
</script>

<template>
  <div class="empty">
    <span class="empty-icon">
      <component :is="icon" :size="26" :stroke-width="1.8" />
    </span>
    <h4>{{ title }}</h4>
    <p v-if="message">{{ message }}</p>
    <div v-if="$slots.default" class="mt-2">
      <slot />
    </div>
  </div>
</template>
