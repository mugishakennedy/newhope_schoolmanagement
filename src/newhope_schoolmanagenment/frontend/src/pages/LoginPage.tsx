import { useState } from 'react'
import type { FormEvent } from 'react'

import { errorMessage } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Alert, Button, Field, Input } from '../components/ui'
import { ThemeToggle } from '../components/ThemeToggle'
import type { ThemeMode } from '../utils/theme'

type Language = 'en' | 'rw' | 'fr'

const COPY: Record<
  Language,
  {
    intro: string
    summary: string
    welcome: string
    signInTitle: string
    signInDescription: string
    identifier: string
    identifierPlaceholder: string
    password: string
    passwordPlaceholder: string
    signIn: string
    registerPrompt: string
    register: string
    teacherNote: string
    darkMode: string
    lightMode: string
    language: string
  }
> = {
  en: {
    intro: 'A better-connected school day.',
    summary:
      'Students follow assignments and feedback, teachers manage classwork and grades, and school leaders keep classes and staff organised.',
    welcome: 'Welcome back',
    signInTitle: 'Sign in to your portal',
    signInDescription:
      'Students can use their STP number or email. Teachers and DOS use their school email.',
    identifier: 'Email or STP number',
    identifierPlaceholder: 'Enter your email or STP number',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    signIn: 'Sign in',
    registerPrompt: 'New to Newhope?',
    register: 'Create a student account',
    teacherNote:
      'Teacher accounts are created by the Dean of Studies. Use the sign-in details provided by your school.',
    darkMode: 'Switch to dark mode',
    lightMode: 'Switch to light mode',
    language: 'Language',
  },
  rw: {
    intro: 'Umunsi mwiza kandi uhuza ibikorwa by’ishuri.',
    summary:
      'Abanyeshuri bakurikirana imikoro n’ibitekerezo bahabwa, abarimu bagacunga amasomo n’amanota, abayobozi bagategura ibyiciro n’abakozi.',
    welcome: 'Murakaza neza',
    signInTitle: 'Injira muri konti yawe',
    signInDescription:
      'Abanyeshuri bashobora gukoresha nimero ya STP cyangwa imeri. Abarimu n’ubuyobozi bakoresha imeri y’ishuri.',
    identifier: 'Imeri cyangwa nimero ya STP',
    identifierPlaceholder: 'Andika imeri cyangwa nimero ya STP',
    password: 'Ijambo ry’ibanga',
    passwordPlaceholder: 'Andika ijambo ry’ibanga',
    signIn: 'Injira',
    registerPrompt: 'Ni mushya kuri Newhope?',
    register: 'Fungura konti y’umunyeshuri',
    teacherNote:
      'Konti z’abarimu zitangwa n’umuyobozi ushinzwe amasomo. Koresha amakuru y’iyinjira wahawe n’ishuri.',
    darkMode: 'Hindura ujye mu buryo bwijimye',
    lightMode: 'Hindura ujye mu buryo bwerurutse',
    language: 'Ururimi',
  },
  fr: {
    intro: 'Une journée scolaire mieux connectée.',
    summary:
      'Les élèves suivent les devoirs et les retours, les enseignants gèrent les cours et les notes, et la direction organise les classes et le personnel.',
    welcome: 'Bon retour',
    signInTitle: 'Connectez-vous à votre portail',
    signInDescription:
      'Les élèves peuvent utiliser leur numéro STP ou leur e-mail. Les enseignants et la direction utilisent leur adresse e-mail scolaire.',
    identifier: 'E-mail ou numéro STP',
    identifierPlaceholder: 'Saisissez votre e-mail ou numéro STP',
    password: 'Mot de passe',
    passwordPlaceholder: 'Saisissez votre mot de passe',
    signIn: 'Se connecter',
    registerPrompt: 'Nouveau sur Newhope ?',
    register: 'Créer un compte élève',
    teacherNote:
      'Les comptes enseignants sont créés par la direction des études. Utilisez les identifiants fournis par votre établissement.',
    darkMode: 'Passer en mode sombre',
    lightMode: 'Passer en mode clair',
    language: 'Langue',
  },
}

function isLanguage(value: string): value is Language {
  return value === 'en' || value === 'rw' || value === 'fr'
}

export function LoginPage({
  navigate,
  theme,
  onToggleTheme,
}: {
  navigate: (path: string) => void
  theme: ThemeMode
  onToggleTheme: () => void
}) {
  const { login } = useAuth()
  const [language, setLanguage] = useState<Language>('en')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const copy = COPY[language]

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const role = await login(identifier.trim(), password)
      navigate(`/${role}`)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page" lang={language}>
      <header className="login-toolbar">
        <div className="login-brand">
          <img src="/favicon.png" alt="" />
          <span>
            <strong>Newhope</strong>
            <small>School Management</small>
          </span>
        </div>
        <div className="login-controls">
          <label className="sr-only" htmlFor="login-language">
            {copy.language}
          </label>
          <select
            id="login-language"
            className="input login-language-select"
            value={language}
            onChange={(event) => {
              if (isLanguage(event.target.value)) {
                setLanguage(event.target.value)
              }
            }}
          >
            <option value="en">English</option>
            <option value="rw">Kinyarwanda</option>
            <option value="fr">Français</option>
          </select>
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
            label={theme === 'light' ? copy.darkMode : copy.lightMode}
          />
        </div>
      </header>

      <section className="login-content" aria-labelledby="login-heading">
        <div className="login-intro">
          <span className="eyebrow">Newhope School Management</span>
          <h1>{copy.intro}</h1>
          <p>{copy.summary}</p>
        </div>

        <div className="login-card">
          <span className="eyebrow">{copy.welcome}</span>
          <h2 id="login-heading">{copy.signInTitle}</h2>
          <p className="auth-subtitle">{copy.signInDescription}</p>

          {error ? <Alert>{error}</Alert> : null}

          <form className="form-stack" onSubmit={onSubmit}>
            <Field label={copy.identifier}>
              <Input
                name="identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={copy.identifierPlaceholder}
                autoComplete="username"
                required
              />
            </Field>

            <Field label={copy.password}>
              <Input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={copy.passwordPlaceholder}
                autoComplete="current-password"
                required
              />
            </Field>

            <Button type="submit" block busy={busy}>
              {copy.signIn}
            </Button>
          </form>

          <div className="auth-divider">
            <span>{copy.registerPrompt}</span>
          </div>

          <Button
            variant="secondary"
            block
            onClick={() => navigate('/register')}
          >
            {copy.register}
          </Button>

          <p className="auth-note">{copy.teacherNote}</p>
        </div>
      </section>
    </main>
  )
}
