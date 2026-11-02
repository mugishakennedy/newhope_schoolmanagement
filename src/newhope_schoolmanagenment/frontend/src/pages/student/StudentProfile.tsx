import { api } from '../../api/client'
import type {
  ClassRead,
  ModuleRead,
  StudentRead,
  TeacherSummary,
} from '../../api/types'
import {
  Alert,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../utils/format'

interface ProfileData {
  student: StudentRead
  schoolClass: ClassRead | null
  modules: ModuleRead[]
  teachers: TeacherSummary[]
}

export function StudentProfile() {
  const profile = useApi<ProfileData>(async () => {
    const [student, schoolClass, modules, teachers] = await Promise.all([
      api.get<StudentRead>('/students/me'),
      api.get<ClassRead>('/students/me/class').catch(() => null),
      api.get<ModuleRead[]>('/students/me/modules').catch(() => []),
      api.get<TeacherSummary[]>('/students/me/teachers').catch(() => []),
    ])
    return { student, schoolClass, modules, teachers }
  }, 'student-profile')

  if (profile.loading) return <Spinner label="Loading your profile" />
  if (profile.error || !profile.data) {
    return <Alert>{profile.error ?? 'Profile unavailable'}</Alert>
  }

  const { student, schoolClass, modules, teachers } = profile.data

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Your record"
        title="Profile"
        subtitle="The details the school uses to connect you to classes, modules, and teachers."
      />

      <div className="content-grid">
        <Card title="Student details">
          <dl className="detail-list">
            <div>
              <dt>Full name</dt>
              <dd>{student.full_name}</dd>
            </div>
            <div>
              <dt>STP number</dt>
              <dd>{student.registration_no}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{student.email}</dd>
            </div>
            <div>
              <dt>Class</dt>
              <dd>
                {schoolClass
                  ? `${schoolClass.class_name} · ${schoolClass.academic_year}`
                  : 'Not assigned'}
              </dd>
            </div>
            <div>
              <dt>Registered</dt>
              <dd>{formatDate(student.created_at)}</dd>
            </div>
          </dl>
        </Card>

        <div className="side-stack">
          <Card title="Modules" subtitle="Available through your class">
            {modules.length === 0 ? (
              <EmptyState
                title="No modules yet"
                description="Modules appear once assignments are published for your class."
              />
            ) : (
              <ul className="simple-list">
                {modules.map((module) => (
                  <li key={module.id}>
                    <span className="code-chip">{module.module_code}</span>
                    <span>{module.module_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Teachers">
            {teachers.length === 0 ? (
              <EmptyState title="No teachers linked yet" />
            ) : (
              <ul className="person-list">
                {teachers.map((teacher) => (
                  <li key={teacher.id}>
                    <span className="avatar avatar-sm">
                      {teacher.full_name.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{teacher.full_name}</strong>
                      <small className="muted">Teacher</small>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
