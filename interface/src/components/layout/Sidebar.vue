<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BookOpen,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-vue-next'

import AvatarBadge from '@/components/AvatarBadge.vue'
import BrandMark from '@/components/BrandMark.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['navigate'])

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const adminNav = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Students', to: '/admin/students', icon: Users },
  { label: 'Teachers', to: '/admin/teachers', icon: GraduationCap },
  { label: 'Classes', to: '/admin/classes', icon: School },
  { label: 'Modules', to: '/admin/modules', icon: BookOpen },
  { label: 'Assignments', to: '/admin/assignments', icon: ClipboardList },
  { label: 'Submissions', to: '/admin/submissions', icon: FileCheck2 },
  { label: 'DOS accounts', to: '/admin/accounts', icon: ShieldCheck },
]

const studentNav = [
  { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
  { label: 'Assignments', to: '/student/assignments', icon: ClipboardList },
  { label: 'My submissions', to: '/student/submissions', icon: FileCheck2 },
  { label: 'Classes', to: '/student/classes', icon: School },
  { label: 'Directory', to: '/student/directory', icon: Users },
  { label: 'My profile', to: '/student/profile', icon: UserRound },
]

const nav = computed(() => (auth.isAdmin ? adminNav : studentNav))
const workspace = computed(() =>
  auth.isAdmin ? 'Administration' : 'Student workspace',
)

function isActive(path) {
  if (path === '/admin' || path === '/student') {
    return route.path === path
  }
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function logout() {
  await auth.logout()
  toast.info('You have been signed out.')
  router.push('/login')
}
</script>

<template>
  <aside class="sidebar" :class="{ 'is-open': open }">
    <div class="sidebar-glow" aria-hidden="true" />

    <div class="sidebar-top">
      <BrandMark light />
      <button class="sidebar-close" @click="emit('navigate')">
        <X :size="18" />
      </button>
    </div>

    <div class="workspace-label">
      <span>{{ workspace }}</span>
    </div>

    <nav class="nav">
      <router-link
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
        @click="emit('navigate')"
      >
        <component :is="item.icon" :size="19" :stroke-width="2" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="mini-profile">
        <AvatarBadge :name="auth.displayName" size="md" />
        <div class="mini-text">
          <strong class="truncate">{{ auth.displayName }}</strong>
          <span>{{ auth.roleLabel }}</span>
        </div>
        <button class="logout-btn" title="Sign out" @click="logout">
          <LogOut :size="17" />
        </button>
      </div>
      <p class="version">NewHope School · 2026</p>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 60;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  padding: 22px 16px 18px;
  background: linear-gradient(178deg, var(--sidebar), var(--sidebar-2));
  color: #e2e8f0;
  overflow: hidden;
  transform: translateX(-100%);
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.is-open {
  transform: translateX(0);
}

.sidebar-glow {
  position: absolute;
  width: 220px;
  height: 220px;
  top: -80px;
  right: -90px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.45), transparent 68%);
  filter: blur(6px);
  pointer-events: none;
}

.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 8px 24px;
  position: relative;
}

.sidebar-close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.07);
  color: #cbd5e1;
}

.workspace-label {
  padding: 0 12px 10px;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.72);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  overflow-y: auto;
  padding: 0 2px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 11px;
  color: #aeb9cd;
  font-size: 0.885rem;
  font-weight: 600;
  transition: background 0.18s ease, color 0.18s ease;
}

.nav-item svg {
  color: #7c8aa3;
  transition: color 0.18s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.055);
  color: #f1f5f9;
}

.nav-item:hover svg {
  color: #c7d2fe;
}

.nav-item.active {
  background: linear-gradient(
    100deg,
    rgba(99, 102, 241, 0.28),
    rgba(14, 165, 233, 0.16)
  );
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.26);
}

.nav-item.active svg {
  color: #c7d2fe;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(#818cf8, #38bdf8);
}

.sidebar-footer {
  position: relative;
  padding-top: 14px;
  margin-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.mini-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.mini-profile :deep(.avatar) {
  background: rgba(255, 255, 255, 0.12);
  color: #dbeafe;
  border-color: rgba(255, 255, 255, 0.14);
}

.mini-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.mini-text strong {
  font-size: 0.82rem;
  color: #f1f5f9;
  font-weight: 700;
}

.mini-text span {
  font-size: 0.68rem;
  color: #94a3b8;
  margin-top: 2px;
}

.logout-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #94a3b8;
  flex-shrink: 0;
  transition: background 0.18s ease, color 0.18s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}

.version {
  margin-top: 12px;
  text-align: center;
  font-size: 0.64rem;
  letter-spacing: 0.06em;
  color: rgba(148, 163, 184, 0.45);
}

@media (min-width: 981px) {
  .sidebar {
    transform: translateX(0);
  }

  .sidebar-close {
    display: none;
  }
}
</style>
