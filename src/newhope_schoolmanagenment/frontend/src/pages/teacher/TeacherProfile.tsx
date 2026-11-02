import { api } from '../../api/client'
import type {
  ClassRead,
  ModuleRead,
  TeacherRead,
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
  teacher: TeacherRead
  classes: ClassRead[]
  modules: ModuleRead[]
}

export function TeacherProfile() {
  const profile = useApi<ProfileData>(async () => {
    const [teacher, classes, modules] = await Promise.all([
      api.get<TeacherRead>('/teacher/me'),
      api.get<ClassRead[]>('/teacher/classes').catch(() => []),
      api.get<ModuleRead[]>('/teacher/modules').catch(() => []),
    ])
    return { teacher, classes, modules }
  }, 'teacher-profile')

  if (profile.loading) return <Spinner label="Loading your profile" />
  if (profile.error || !profile.data) {
    return <Alert>{profile.error ?? 'Profile unavailable'}</Alert>
  }

  const { teacher, classes, modules } = profile.data

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Your record"
        title="Profile"
        subtitle="Your staff details and the classes and modules you teach."
      />

      <div className="content-grid">
        <Card title="Teacher details">
          <dl className="detail-list">
            <div>
              <dt>Full name</dt>
              <dd>{teacher.full_name}</dd>
            </div>
            <div>
              <dt>Employee code</dt>
              <dd>{teacher.employee_code}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{teacher.email}</dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>{formatDate(teacher.created_at)}</dd>
            </div>
          </dl>
        </Card>

        <div className="side-stack">
          <Card title="Classes" subtitle="Where you are assigned">
            {classes.length === 0 ? (
              <EmptyState
                title="No classes assigned"
                description="The DOS can assign you to classes and modules."
              />
            ) : (
              <ul className="simple-list">
                {classes.map((item) => (
                  <li key={item.id}>
                    <span className="code-chip">{item.class_name}</span>
                    <span className="muted">{item.academic_year}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Modules" subtitle="Subjects you teach">
            {modules.length === 0 ? (
              <EmptyState title="No modules assigned" />
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
        </div>
      </div>
    </div>
  )
}
