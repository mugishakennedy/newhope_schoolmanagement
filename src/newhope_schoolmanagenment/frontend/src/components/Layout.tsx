import type { ReactNode } from 'react'

import type { SessionUser } from '../api/types'
import { initials, roleLabel } from '../utils/format'
import type { ThemeMode } from '../utils/theme'
import { ThemeToggle } from './ThemeToggle'
import { Button } from './ui'

export interface NavItem {
  label: string
  path: string
}

interface LayoutProps {
  user: SessionUser
  nav: NavItem[]
  path: string
  navigate: (path: string) => void
  theme: ThemeMode
  onToggleTheme: () => void
  onLogout: () => void
  children: ReactNode
}

export function Layout({
  user,
  nav,
  path,
  navigate,
  theme,
  onToggleTheme,
  onLogout,
  children,
}: LayoutProps) {
  const active = nav.find((item) => item.path === path) ?? nav[0]
  const title = active?.label ?? 'Dashboard'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          type="button"
          className="sidebar-brand"
          onClick={() => navigate(nav[0]?.path ?? '/')}
        >
          <span className="brand-mark">
            <img src="/favicon.png" alt="" />
          </span>
          <span>
            <strong>Newhope</strong>
            <small>School Management</small>
          </span>
        </button>

        <div className="sidebar-role">
          <span>{roleLabel(user.role)}</span>
          <p>Signed in as {user.full_name}</p>
        </div>

        <nav className="sidebar-nav" aria-label="Portal navigation">
          {nav.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`nav-item ${item.path === path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-dot" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">
            <span className="avatar">{initials(user.full_name)}</span>
            <span>
              <strong>{user.full_name}</strong>
              <small>{user.email}</small>
            </span>
          </div>
          <Button variant="ghost" size="sm" block onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">Newhope portal</span>
            <h1>{title}</h1>
          </div>
          <div className="topbar-meta">
            <ThemeToggle
              theme={theme}
              onToggle={onToggleTheme}
              label={theme === 'light' ? 'Dark mode' : 'Light mode'}
            />
            <span className="topbar-chip">{roleLabel(user.role)}</span>
            <span className="avatar avatar-sm">{initials(user.full_name)}</span>
          </div>
        </header>
        <div className="page">{children}</div>
      </main>
    </div>
  )
}
