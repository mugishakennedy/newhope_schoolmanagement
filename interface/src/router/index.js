import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true, title: 'Sign in' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { public: true, title: 'Create account' },
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: () =>
          localStorage.getItem('nh_role') === 'dos' ? '/admin' : '/student',
      },
      {
        path: 'admin',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/AdminDashboard.vue'),
        meta: { requiresAuth: true, role: 'dos', title: 'Dashboard' },
      },
      {
        path: 'admin/students',
        name: 'admin-students',
        component: () => import('@/views/admin/StudentsView.vue'),
        meta: { requiresAuth: true, role: 'dos', title: 'Students' },
      },
      {
        path: 'admin/teachers',
        name: 'admin-teachers',
        component: () => import('@/views/admin/TeachersView.vue'),
        meta: { requiresAuth: true, role: 'dos', title: 'Teachers' },
      },
      {
        path: 'admin/classes',
        name: 'admin-classes',
        component: () => import('@/views/admin/ClassesView.vue'),
        meta: { requiresAuth: true, role: 'dos', title: 'Classes' },
      },
      {
        path: 'admin/modules',
        name: 'admin-modules',
        component: () => import('@/views/admin/ModulesView.vue'),
        meta: { requiresAuth: true, role: 'dos', title: 'Modules' },
      },
      {
        path: 'admin/assignments',
        name: 'admin-assignments',
        component: () => import('@/views/admin/AssignmentsView.vue'),
        meta: { requiresAuth: true, role: 'dos', title: 'Assignments' },
      },
      {
        path: 'admin/submissions',
        name: 'admin-submissions',
        component: () => import('@/views/admin/SubmissionsView.vue'),
        meta: { requiresAuth: true, role: 'dos', title: 'Submissions' },
      },
      {
        path: 'admin/accounts',
        name: 'admin-accounts',
        component: () => import('@/views/admin/AccountsView.vue'),
        meta: { requiresAuth: true, role: 'dos', title: 'DOS accounts' },
      },
      {
        path: 'student',
        name: 'student-dashboard',
        component: () => import('@/views/student/StudentDashboard.vue'),
        meta: { requiresAuth: true, role: 'student', title: 'Dashboard' },
      },
      {
        path: 'student/assignments',
        name: 'student-assignments',
        component: () => import('@/views/student/StudentAssignments.vue'),
        meta: { requiresAuth: true, role: 'student', title: 'Assignments' },
      },
      {
        path: 'student/submissions',
        name: 'student-submissions',
        component: () => import('@/views/student/StudentSubmissions.vue'),
        meta: { requiresAuth: true, role: 'student', title: 'My submissions' },
      },
      {
        path: 'student/classes',
        name: 'student-classes',
        component: () => import('@/views/student/StudentClasses.vue'),
        meta: { requiresAuth: true, role: 'student', title: 'Classes' },
      },
      {
        path: 'student/directory',
        name: 'student-directory',
        component: () => import('@/views/student/StudentDirectory.vue'),
        meta: { requiresAuth: true, role: 'student', title: 'Student directory' },
      },
      {
        path: 'student/profile',
        name: 'student-profile',
        component: () => import('@/views/student/StudentProfile.vue'),
        meta: { requiresAuth: true, role: 'student', title: 'My profile' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
    meta: { public: true, title: 'Page not found' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.token) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.role && auth.role && auth.role !== to.meta.role) {
    return auth.isAdmin
      ? { name: 'admin-dashboard' }
      : { name: 'student-dashboard' }
  }

  if ((to.name === 'login' || to.name === 'register') && auth.token) {
    return auth.isAdmin
      ? { name: 'admin-dashboard' }
      : { name: 'student-dashboard' }
  }

  return true
})

router.afterEach((to) => {
  const title = to.meta.title
  document.title = title
    ? `${title} · NewHope School`
    : 'NewHope School · Management Portal'
})

export default router
