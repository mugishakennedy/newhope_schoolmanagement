import { createContext } from 'react'

import type { Role, SessionUser } from '../api/types'

export interface RegisterStudentInput {
  full_name: string
  email: string
  password: string
  registration_no: string
  class_id: number | null
}

export interface AuthContextValue {
  user: SessionUser | null
  status: 'loading' | 'anonymous' | 'authenticated'
  login: (identifier: string, password: string) => Promise<Role>
  registerStudent: (data: RegisterStudentInput) => Promise<Role>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
