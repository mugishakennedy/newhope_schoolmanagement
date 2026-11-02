import { useMemo, useState } from 'react'

import { api } from '../../api/client'
import type {
  AssignmentDetail,
  SubmissionWithStudent,
} from '../../api/types'
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDate, isPast } from '../../utils/format'

interface AssignmentData {
  assignments: AssignmentDetail[]
  submissions: SubmissionWithStudent[]
}

export function TeacherAssignments() {
  const data = useApi<AssignmentData>(async () => {
    const [assignments, submissions] = await Promise.all([
      api.get<AssignmentDetail[]>('/teacher/assignments'),
      api.get<SubmissionWithStudent[]>('/teacher/submissions').catch(() => []),
    ])
    return { assignments, submissions }
  }, 'teacher-assignments')

  const [classFilter, setClassFilter] = useState('all')

  const classes = useMemo(() => {
    const map = new Map<number, string>()
    for (const assignment of data.data?.assignments ?? []) {
      map.set(assignment.school_class.id, assignment.school_class.class_name)
    }
    return Array.from(map.entries())
  }, [data.data])

  const submissionCount = useMemo(() => {
    const map = new Map<number, number>()
    for (const submission of data.data?.submissions ?? []) {
      map.set(submission.assignment_id, (map.get(submission.assignment_id) ?? 0) + 1)
    }
    return map
  }, [data.data])

  const assignments = useMemo(() => {
    const all = data.data?.assignments ?? []
    if (classFilter === 'all') return all
    return all.filter(
      (item) => item.school_class.id === Number(classFilter),
    )
  }, [data.data, classFilter])

  if (data.loading) return <Spinner label="Loading assignments" />
  if (data.error) return <Alert>{data.error}</Alert>

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Teaching"
        title="Assignments"
        subtitle="Every assignment the Dean of Studies has published for your classes."
        action={
          <Select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            aria-label="Filter by class"
          >
            <option value="all">All classes</option>
            {classes.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        }
      />

      <Card>
        {assignments.length === 0 ? (
          <EmptyState
            title="No assignments"
            description="The DOS has not published assignments for your classes yet."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Module</th>
                  <th>Class</th>
                  <th>Deadline</th>
                  <th>Submissions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>
                      <div className="cell-main">
                        <strong>{assignment.title}</strong>
                        {assignment.description ? (
                          <small className="muted">
                            {assignment.description}
                          </small>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div>{assignment.module.module_name}</div>
                      <small className="muted">
                        {assignment.module.module_code}
                      </small>
                    </td>
                    <td>
                      <div>{assignment.school_class.class_name}</div>
                      <small className="muted">
                        {assignment.school_class.academic_year}
                      </small>
                    </td>
                    <td>
                      <Badge
                        tone={isPast(assignment.deadline) ? 'danger' : 'gold'}
                      >
                        {formatDate(assignment.deadline)}
                      </Badge>
                    </td>
                    <td>
                      <strong>{submissionCount.get(assignment.id) ?? 0}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
