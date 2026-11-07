<script setup>
import { onMounted } from 'vue'

import ToastHost from '@/components/ToastHost.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => {
  if (auth.token) {
    auth.restore()
  }
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <ToastHost />
</template>
