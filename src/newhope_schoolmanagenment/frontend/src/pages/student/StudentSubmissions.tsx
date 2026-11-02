import { api } from '../../api/client'
import type { SubmissionWithAssignment } from '../../api/types'
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, gradeLabel } from '../../utils/format'

export function StudentSubmissions() {
  const submissions = useApi<SubmissionWithAssignment[]>(
    () => api.get('/students/me/submissions'),
    'student-submissions',
  )

  if (submissions.loading) {
    return <Spinner label="Loading your submissions" />
  }

  if (submissions.error) {
    return <Alert>{submissions.error}</Alert>
  }

  const items = submissions.data ?? []
  const graded = items.filter(
    (item) => item.grade !== null && item.grade !== undefined,
  )

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Your work"
        title="Submissions"
        subtitle="Every assignment you have submitted, with grades and feedback as they arrive."
      />

      <div className="stats-grid stats-grid-3">
        <div className="stat-card stat-info">
          <span className="stat-label">Submitted</span>
          <strong className="stat-value">{items.length}</strong>
          <span className="stat-hint">Across all modules</span>
        </div>
        <div className="stat-card stat-success">
          <span className="stat-label">Graded</span>
          <strong className="stat-value">{graded.length}</strong>
          <span className="stat-hint">Feedback published</span>
        </div>
        <div className="stat-card stat-gold">
          <span className="stat-label">Waiting</span>
          <strong className="stat-value">{items.length - graded.length}</strong>
          <span className="stat-hint">Awaiting a grade</span>
        </div>
      </div>

      <Card title="Submission history">
        {items.length === 0 ? (
          <EmptyState
            title="Nothing submitted yet"
            description="Open an assignment and submit a link to your work."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Module</th>
                  <th>Submitted</th>
                  <th>Grade</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {items.map((submission) => {
                  const hasGrade =
                    submission.grade !== null && submission.grade !== undefined
                  return (
                    <tr key={submission.id}>
                      <td>
                        <div className="cell-main">
                          <strong>{submission.assignment.title}</strong>
                          <a
                            href={submission.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-link"
                          >
                            Open work
                          </a>
                        </div>
                      </td>
                      <td>{submission.assignment.module.module_name}</td>
                      <td>{formatDateTime(submission.submitted_at)}</td>
                      <td>
                        <Badge tone={hasGrade ? 'success' : 'neutral'}>
                          {gradeLabel(submission.grade)}
                        </Badge>
                      </td>
                      <td>
                        {submission.feedback ? (
                          <span>{submission.feedback}</span>
                        ) : (
                          <span className="muted">No feedback yet</span>
                        )}
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
