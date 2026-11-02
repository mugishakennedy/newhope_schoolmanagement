import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import {
  api,
  clearSession,
  getStoredUser,
  getToken,
  setSession,
} from '../api/client'
import type {
  LoginResponse,
  SessionResponse,
  SessionUser,
  StudentRead,
} from '../api/types'
import { AuthContext } from './context'
import type { AuthContextValue, RegisterStudentInput } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getStoredUser())
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')

  useEffect(() => {
    let active = true

    async function bootstrap() {
      if (!getToken()) {
        if (active) setStatus('anonymous')
        return
      }

      try {
        const session = await api.get<SessionResponse>('/auth/session')
        if (!active) return
        setUser(session.user)
        setSession(getToken() ?? '', session.user)
        setStatus('authenticated')
      } catch {
        if (!active) return
        clearSession()
        setUser(null)
        setStatus('anonymous')
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await api.post<LoginResponse>('/auth/login', {
      identifier,
      password,
    })
    setSession(data.access_token, data.user)
    setUser(data.user)
    setStatus('authenticated')
    return data.role
  }, [])

  const registerStudent = useCallback(
    async (data: RegisterStudentInput) => {
      const student = await api.post<StudentRead>('/students/register', data)
      const role = await login(student.email, data.password)
      return role
    },
    [login],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Clearing the local session is what matters if the network is down.
    }
    clearSession()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const refreshUser = useCallback(async () => {
    const session = await api.get<SessionResponse>('/auth/session')
    setUser(session.user)
    setSession(getToken() ?? '', session.user)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, registerStudent, logout, refreshUser }),
    [user, status, login, registerStudent, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
