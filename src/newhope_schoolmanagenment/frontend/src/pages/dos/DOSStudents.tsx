import { useMemo } from 'react'

import { api } from '../../api/client'
import type { ClassRead, StudentRead } from '../../api/types'
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../utils/format'

interface StudentData {
  students: StudentRead[]
  classes: ClassRead[]
}

export function DOSStudents() {
  const data = useApi<StudentData>(async () => {
    const [students, classes] = await Promise.all([
      api.get<StudentRead[]>('/dos/students'),
      api.get<ClassRead[]>('/dos/classes').catch(() => []),
    ])
    return { students, classes }
  }, 'dos-students')

  const classById = useMemo(() => {
    const map = new Map<number, ClassRead>()
    for (const item of data.data?.classes ?? []) {
      map.set(item.id, item)
    }
    return map
  }, [data.data])

  if (data.loading) return <Spinner label="Loading students" />
  if (data.error) return <Alert>{data.error}</Alert>

  const students = data.data?.students ?? []
  const withoutClass = students.filter((item) => item.class_id === null).length

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Students"
        title="Student register"
        subtitle="Students create their own accounts. Use this list to confirm STP numbers and class placement."
      />

      <div className="stats-grid stats-grid-3">
        <div className="stat-card stat-info">
          <span className="stat-label">Registered</span>
          <strong className="stat-value">{students.length}</strong>
          <span className="stat-hint">Student accounts</span>
        </div>
        <div className="stat-card stat-gold">
          <span className="stat-label">Without a class</span>
          <strong className="stat-value">{withoutClass}</strong>
          <span className="stat-hint">Need placement</span>
        </div>
        <div className="stat-card stat-success">
          <span className="stat-label">Classes</span>
          <strong className="stat-value">{data.data?.classes.length ?? 0}</strong>
          <span className="stat-hint">Available</span>
        </div>
      </div>

      <Card>
        {students.length === 0 ? (
          <EmptyState
            title="No students registered"
            description="Students will appear here after they create their own accounts."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>STP number</th>
                  <th>Class</th>
                  <th>Email</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const schoolClass =
                    student.class_id !== null
                      ? classById.get(student.class_id)
                      : undefined
                  return (
                    <tr key={student.id}>
                      <td>
                        <strong>{student.full_name}</strong>
                      </td>
                      <td>
                        <Badge tone="gold">{student.registration_no}</Badge>
                      </td>
                      <td>
                        {schoolClass ? (
                          <div>
                            {schoolClass.class_name}
                            <small className="muted block">
                              {schoolClass.academic_year}
                            </small>
                          </div>
                        ) : (
                          <span className="muted">Not assigned</span>
                        )}
                      </td>
                      <td>{student.email}</td>
                      <td className="muted">
                        {formatDate(student.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
