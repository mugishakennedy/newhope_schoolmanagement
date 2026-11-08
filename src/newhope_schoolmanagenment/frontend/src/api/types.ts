export type Role = 'student' | 'teacher' | 'dos'
export type AssignmentKind = 'assignment' | 'quiz'
export type QuestionKind = 'multiple_choice' | 'short_answer'

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
  kind: AssignmentKind
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
  kind: AssignmentKind
  deadline: string | null
  created_at: string
}

export interface AssignmentAttachment {
  id: number
  assignment_id: number
  uploaded_by_teacher_id: number | null
  original_name: string
  content_url: string
  content_type: string | null
  size_bytes: number
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

export interface QuizOptionRead {
  id: number
  position: number
  text: string
}

export interface QuizOptionTeacherRead extends QuizOptionRead {
  is_correct: boolean
}

export interface QuizQuestionRead {
  id: number
  position: number
  prompt: string
  kind: QuestionKind
  points: string | number
  options: QuizOptionRead[]
}

export interface QuizQuestionTeacherRead extends QuizQuestionRead {
  correct_answer: string | null
  options: QuizOptionTeacherRead[]
}

export interface QuizRead {
  assignment_id: number
  questions: QuizQuestionRead[]
}

export interface QuizTeacherRead {
  assignment_id: number
  questions: QuizQuestionTeacherRead[]
}

export interface QuizOptionInput {
  text: string
  is_correct: boolean
}

export interface QuizQuestionInput {
  prompt: string
  kind: QuestionKind
  points: number
  correct_answer: string | null
  options: QuizOptionInput[]
}

export interface QuizPayload {
  questions: QuizQuestionInput[]
}

export interface QuizAnswerInput {
  question_id: number
  selected_option_id: number | null
  answer_text: string | null
}

export interface QuizAnswerRead {
  id: number
  question_id: number
  selected_option_id: number | null
  answer_text: string | null
  is_correct: boolean
  points_awarded: string | number
}

export interface QuizAttemptRead {
  id: number
  assignment_id: number
  student_id: number
  submission_id: number | null
  score: string | number
  max_score: string | number
  submitted_at: string
  answers: QuizAnswerRead[]
}
