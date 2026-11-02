import { useEffect, useState } from 'react'

import type { Role } from './api/types'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import { Layout } from './components/Layout'
import type { NavItem } from './components/Layout'
import { Splash } from './components/Splash'
import { DOSAccounts } from './pages/dos/DOSAccounts'
import { DOSAssignments } from './pages/dos/DOSAssignments'
import { DOSClasses } from './pages/dos/DOSClasses'
import { DOSModules } from './pages/dos/DOSModules'
import { DOSOverview } from './pages/dos/DOSOverview'
import { DOSStudents } from './pages/dos/DOSStudents'
import { DOSSubmissions } from './pages/dos/DOSSubmissions'
import { DOSTeachers } from './pages/dos/DOSTeachers'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { StudentAssignments } from './pages/student/StudentAssignments'
import { StudentOverview } from './pages/student/StudentOverview'
import { StudentProfile } from './pages/student/StudentProfile'
import { StudentSubmissions } from './pages/student/StudentSubmissions'
import { TeacherAssignments } from './pages/teacher/TeacherAssignments'
import { TeacherOverview } from './pages/teacher/TeacherOverview'
import { TeacherProfile } from './pages/teacher/TeacherProfile'
import { TeacherSubmissions } from './pages/teacher/TeacherSubmissions'
import { useHashRoute } from './router'
import type { ThemeMode } from './utils/theme'

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: [
    { label: 'Overview', path: '/student' },
    { label: 'Assignments', path: '/student/assignments' },
    { label: 'Submissions', path: '/student/submissions' },
    { label: 'Profile', path: '/student/profile' },
  ],
  teacher: [
    { label: 'Overview', path: '/teacher' },
    { label: 'Assignments', path: '/teacher/assignments' },
    { label: 'Submissions', path: '/teacher/submissions' },
    { label: 'Profile', path: '/teacher/profile' },
  ],
  dos: [
    { label: 'Overview', path: '/dos' },
    { label: 'Classes', path: '/dos/classes' },
    { label: 'Modules', path: '/dos/modules' },
    { label: 'Teachers', path: '/dos/teachers' },
    { label: 'Students', path: '/dos/students' },
    { label: 'Assignments', path: '/dos/assignments' },
    { label: 'Submissions', path: '/dos/submissions' },
    { label: 'DOS accounts', path: '/dos/accounts' },
  ],
}

function Portal() {
  const { user, status, logout } = useAuth()
  const [path, navigate] = useHashRoute()
  const [splashDone, setSplashDone] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return window.localStorage.getItem('newhope.theme') === 'dark'
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('newhope.theme', theme)
  }, [theme])

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashDone(true), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [path])

  useEffect(() => {
    if (status !== 'anonymous') return
    if (path !== '/login' && path !== '/register') {
      navigate('/login')
    }
  }, [status, path, navigate])

  useEffect(() => {
    if (status !== 'authenticated' || !user) return
    const nav = NAV_BY_ROLE[user.role]
    if (!nav.some((item) => item.path === path)) {
      navigate(nav[0].path)
    }
  }, [status, user, path, navigate])

  if (!splashDone || status === 'loading') {
    return <Splash />
  }

  if (status === 'anonymous' || !user) {
    if (path === '/register') {
      return (
        <RegisterPage
          navigate={navigate}
          theme={theme}
          onToggleTheme={() =>
            setTheme((current) => (current === 'light' ? 'dark' : 'light'))
          }
        />
      )
    }
    return (
      <LoginPage
        navigate={navigate}
        theme={theme}
        onToggleTheme={() =>
          setTheme((current) => (current === 'light' ? 'dark' : 'light'))
        }
      />
    )
  }

  const nav = NAV_BY_ROLE[user.role]
  const role = user.role

  function renderPage() {
    switch (role) {
      case 'student':
        if (path === '/student/assignments') return <StudentAssignments />
        if (path === '/student/submissions') return <StudentSubmissions />
        if (path === '/student/profile') return <StudentProfile />
        return <StudentOverview navigate={navigate} />
      case 'teacher':
        if (path === '/teacher/assignments') return <TeacherAssignments />
        if (path === '/teacher/submissions') return <TeacherSubmissions />
        if (path === '/teacher/profile') return <TeacherProfile />
        return <TeacherOverview navigate={navigate} />
      case 'dos':
        if (path === '/dos/classes') return <DOSClasses />
        if (path === '/dos/modules') return <DOSModules />
        if (path === '/dos/teachers') return <DOSTeachers />
        if (path === '/dos/students') return <DOSStudents />
        if (path === '/dos/assignments') return <DOSAssignments />
        if (path === '/dos/submissions') return <DOSSubmissions />
        if (path === '/dos/accounts') return <DOSAccounts />
        return <DOSOverview navigate={navigate} />
      default:
        return null
    }
  }

  return (
    <Layout
      user={user}
      nav={nav}
      path={path}
      navigate={navigate}
      theme={theme}
      onToggleTheme={() =>
        setTheme((current) => (current === 'light' ? 'dark' : 'light'))
      }
      onLogout={() => {
        void logout().then(() => navigate('/login'))
      }}
    >
      {renderPage()}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Portal />
    </AuthProvider>
  )
}
