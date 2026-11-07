<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CalendarDays,
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
} from 'lucide-vue-next'

import AvatarBadge from '@/components/AvatarBadge.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['toggle-sidebar'])

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const menuOpen = ref(false)
const menuRef = ref(null)

const title = computed(() => route.meta.title || 'Dashboard')
const today = computed(() =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function onClickOutside(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    menuOpen.value = false
  }
}

async function logout() {
  menuOpen.value = false
  await auth.logout()
  toast.info('You have been signed out.')
  router.push('/login')
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="menu-btn" @click="emit('toggle-sidebar')">
        <Menu :size="20" />
      </button>
      <div>
        <p class="topbar-eyebrow">{{ auth.roleLabel }}</p>
        <h1 class="topbar-title">{{ title }}</h1>
      </div>
    </div>

    <div class="topbar-right">
      <span class="date-chip">
        <CalendarDays :size="15" />
        <span class="date-text">{{ today }}</span>
      </span>

      <div ref="menuRef" class="user-menu">
        <button class="user-trigger" @click="toggleMenu">
          <AvatarBadge :name="auth.displayName" size="md" />
          <span class="user-meta">
            <strong>{{ auth.displayName }}</strong>
            <small>{{ auth.roleLabel }}</small>
          </span>
          <ChevronDown :size="15" class="chev" :class="{ open: menuOpen }" />
        </button>

        <Transition name="pop">
          <div v-if="menuOpen" class="dropdown">
            <div class="dropdown-head">
              <AvatarBadge :name="auth.displayName" size="lg" />
              <div class="dropdown-id">
                <strong>{{ auth.displayName }}</strong>
                <span>{{ auth.user?.email || 'Signed in' }}</span>
                <span class="badge badge-primary">{{ auth.roleLabel }}</span>
              </div>
            </div>
            <div class="dropdown-body">
              <router-link
                v-if="auth.isStudent"
                to="/student/profile"
                class="dropdown-item"
                @click="menuOpen = false"
              >
                <UserRound :size="16" />
                My profile
              </router-link>
              <button class="dropdown-item danger" @click="logout">
                <LogOut :size="16" />
                Sign out
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 78px;
  padding: 14px 30px;
  background: rgba(245, 247, 251, 0.82);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.menu-btn {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface);
  color: var(--ink-2);
  flex-shrink: 0;
}

.topbar-eyebrow {
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted-2);
  margin-bottom: 3px;
}

.topbar-title {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 13px;
  border-radius: 11px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 600;
  white-space: nowrap;
}

.user-menu {
  position: relative;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 4px 10px 4px 5px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.user-trigger:hover {
  border-color: #cbd5e1;
  box-shadow: var(--shadow-sm);
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
  max-width: 150px;
}

.user-meta strong {
  font-size: 0.8rem;
  font-weight: 700;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-meta small {
  font-size: 0.68rem;
  color: var(--muted);
  margin-top: 2px;
}

.chev {
  color: var(--muted-2);
  transition: transform 0.2s ease;
}

.chev.open {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  top: calc(100% + 9px);
  right: 0;
  width: 268px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.dropdown-head {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(160deg, #f8faff, #f1f5ff);
  border-bottom: 1px solid var(--line-2);
}

.dropdown-id {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  min-width: 0;
}

.dropdown-id strong {
  font-size: 0.9rem;
  font-weight: 800;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-id span {
  font-size: 0.74rem;
  color: var(--muted);
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-body {
  padding: 8px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 11px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--ink-2);
  font-size: 0.84rem;
  font-weight: 600;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--surface-2);
}

.dropdown-item.danger {
  color: var(--danger);
}

.dropdown-item.danger:hover {
  background: var(--danger-soft);
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
  transform-origin: top right;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}

@media (max-width: 980px) {
  .topbar {
    padding: 12px 18px;
  }
}

@media (max-width: 760px) {
  .date-text,
  .user-meta {
    display: none;
  }

  .date-chip {
    padding: 0 10px;
  }

  .user-trigger {
    padding: 4px;
    height: auto;
  }

  .chev {
    display: none;
  }

  .topbar-eyebrow {
    display: none;
  }

  .topbar-title {
    font-size: 1.02rem;
  }
}
</style>
