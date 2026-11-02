export type Role = 'student' | 'teacher' | 'dos'

export interface SessionUser {
  id: number
  full_name: string
  email: string
  role: Role
  registration_no?: string | null
  class_id?: number | null
  employee_code?: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_expires_in: number
}

export interface LoginResponse extends TokenResponse {
  role: Role
  user: SessionUser
}

export interface SessionResponse {
  role: Role
  user: SessionUser
}

export interface ClassRead {
  id: number
  class_name: string
  academic_year: string
}

export interface ModuleRead {
  id: number
  module_code: string
  module_name: string
  description?: string | null
}

export interface StudentRead {
  id: number
  full_name: string
  email: string
  registration_no: string
  class_id: number | null
  created_at: string
}

export interface TeacherRead {
  id: number
  full_name: string
  email: string
  employee_code: string
  created_at: string
}

export interface TeacherSummary {
  id: number
  full_name: string
}

export interface ModuleSummary {
  id: number
  module_code: string
  module_name: string
}

export interface StudentSummary {
  id: number
  full_name: string
  registration_no: string
}

export interface AssignmentSummary {
  id: number
  title: string
  deadline: string | null
  module: ModuleSummary
}

export interface AssignmentDetail extends AssignmentSummary {
  description: string | null
  created_at: string
  teacher: TeacherSummary
  school_class: ClassRead
}

export interface AssignmentRecord {
  id: number
  teacher_id: number
  module_id: number
  class_id: number
  title: string
  description: string | null
  deadline: string | null
  created_at: string
}

export interface SubmissionRead {
  id: number
  assignment_id: number
  student_id: number
  content_url: string
  grade: string | number | null
  feedback: string | null
  submitted_at: string
}

export interface SubmissionWithAssignment extends SubmissionRead {
  assignment: AssignmentSummary
}

export interface SubmissionWithStudent extends SubmissionRead {
  assignment: AssignmentSummary
  student: StudentSummary
}

export interface DOSRead {
  id: number
  full_name: string
  email: string
  created_at: string
}

export interface TeacherModuleRead {
  id: number
  teacher_id: number
  module_id: number
  class_id: number
}

export interface DOSDashboard {
  students: number
  teachers: number
  classes: number
  modules: number
  assignments: number
  submissions: number
  ungraded_submissions: number
}

export interface TeacherDashboard {
  assignments: number
  submissions: number
  ungraded_submissions: number
  classes: number
  modules: number
}

export interface MessageResponse {
  message: string
}
