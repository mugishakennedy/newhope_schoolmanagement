<script setup>
import { computed } from 'vue'

import { initials } from '@/utils/format'

const props = defineProps({
  name: { type: String, default: '' },
  size: { type: String, default: 'md' },
  soft: { type: Boolean, default: false },
})

const letters = computed(() => initials(props.name))
</script>

<template>
  <span
    class="avatar"
    :class="[`avatar-${size}`, { 'avatar-soft': soft }]"
    :title="name"
  >
    {{ letters }}
  </span>
</template>
