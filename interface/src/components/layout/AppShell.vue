<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import Sidebar from '@/components/layout/Sidebar.vue'
import Topbar from '@/components/layout/Topbar.vue'

const route = useRoute()
const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  },
)
</script>

<template>
  <div class="shell">
    <Sidebar :open="sidebarOpen" @navigate="closeSidebar" />

    <div
      v-if="sidebarOpen"
      class="shell-scrim"
      @click="closeSidebar"
      aria-hidden="true"
    />

    <div class="shell-main">
      <Topbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="shell-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

.shell-main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.shell-content {
  width: 100%;
  max-width: 1380px;
  margin: 0 auto;
  padding: 28px 30px 56px;
  flex: 1;
}

.shell-scrim {
  position: fixed;
  inset: 0;
  z-index: 55;
  background: rgba(9, 15, 31, 0.45);
  backdrop-filter: blur(2px);
}

@media (min-width: 981px) {
  .shell-main {
    margin-left: var(--sidebar-width);
  }

  .shell-scrim {
    display: none;
  }
}

@media (max-width: 980px) {
  .shell-content {
    padding: 22px 18px 48px;
  }
}
</style>
