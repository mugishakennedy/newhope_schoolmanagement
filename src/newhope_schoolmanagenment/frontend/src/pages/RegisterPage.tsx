import { useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../api/client'
import type { ClassRead } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { ThemeToggle } from '../components/ThemeToggle'
import { Alert, Button, Field, Input, Select, Spinner } from '../components/ui'
import { useApi } from '../hooks/useApi'
import type { ThemeMode } from '../utils/theme'

export function RegisterPage({
  navigate,
  theme,
  onToggleTheme,
}: {
  navigate: (path: string) => void
  theme: ThemeMode
  onToggleTheme: () => void
}) {
  const { registerStudent } = useAuth()
  const classes = useApi<ClassRead[]>(() => api.get('/public/classes'), 'classes')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [classId, setClassId] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const role = await registerStudent({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        class_id: classId ? Number(classId) : null,
      })
      navigate(`/${role}`)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-theme-control">
        <ThemeToggle
          theme={theme}
          onToggle={onToggleTheme}
          label={theme === 'light' ? 'Dark mode' : 'Light mode'}
        />
      </div>
      <section className="auth-brand auth-brand-compact">
        <div className="auth-brand-inner">
          <span className="brand-kicker">Student registration</span>
          <h1>Your school record starts here.</h1>
          <p className="auth-lede">
            Register once and access your class, modules, teachers, and
            assignments in your portal.
          </p>

          <div className="auth-hero-card">
            <img src="/favicon.png" alt="" />
            <div>
              <strong>Only students self-register.</strong>
              <p>
                Teachers are added by the Dean of Studies and receive their
                sign-in details directly.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="text-link auth-back"
            onClick={() => navigate('/login')}
          >
            Already have an account? Sign in
          </button>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">Create your account</span>
          <h2>Student registration</h2>
          <p className="auth-subtitle">
            Use the details on your school record so your class and work line up
            correctly.
          </p>

          {error ? <Alert>{error}</Alert> : null}

          <form className="form-stack" onSubmit={onSubmit}>
            <Field label="Full name">
              <Input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>

            <Field
              label="Class"
              hint={
                classes.error
                  ? 'Classes could not be loaded. You can be assigned later.'
                  : 'Classes are created by the DOS. Select the class you were placed in.'
              }
            >
              <Select
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                disabled={classes.loading}
              >
                <option value="">Not assigned yet</option>
                {(classes.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.class_name} · {item.academic_year}
                  </option>
                ))}
              </Select>
            </Field>
            {classes.loading ? <Spinner label="Loading classes" /> : null}

            <div className="form-grid password-form-grid">
              <Field label="Password" hint="At least 8 characters.">
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>

              <Field label="Confirm password">
                <Input
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
            </div>

            <Button type="submit" block busy={busy}>
              Create account
            </Button>
          </form>

          <p className="auth-note">
            Contact the school office if your class placement needs to be
            changed.
          </p>
        </div>
      </section>
    </div>
  )
}
