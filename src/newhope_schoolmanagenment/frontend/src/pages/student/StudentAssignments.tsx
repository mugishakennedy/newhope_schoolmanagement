import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type {
  AssignmentDetail,
  ModuleRead,
  SubmissionRead,
  SubmissionWithAssignment,
} from '../../api/types'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { submissionStatus } from '../../utils/assignment'
import {
  formatDate,
  formatDateTime,
  gradeLabel,
  isPast,
} from '../../utils/format'

interface AssignmentData {
  assignments: AssignmentDetail[]
  modules: ModuleRead[]
  submissions: SubmissionWithAssignment[]
}

export function StudentAssignments() {
  const portal = useApi<AssignmentData>(async () => {
    const [assignments, modules, submissions] = await Promise.all([
      api.get<AssignmentDetail[]>('/students/me/assignments'),
      api.get<ModuleRead[]>('/students/me/modules').catch(() => []),
      api
        .get<SubmissionWithAssignment[]>('/students/me/submissions')
        .catch(() => []),
    ])
    return { assignments, modules, submissions }
  }, 'student-assignments')

  const [moduleFilter, setModuleFilter] = useState('all')
  const [active, setActive] = useState<AssignmentDetail | null>(null)
  const [contentUrl, setContentUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submissionByAssignment = useMemo(() => {
    const map = new Map<number, SubmissionWithAssignment>()
    for (const submission of portal.data?.submissions ?? []) {
      map.set(submission.assignment_id, submission)
    }
    return map
  }, [portal.data])

  const assignments = useMemo(() => {
    const all = portal.data?.assignments ?? []
    if (moduleFilter === 'all') return all
    return all.filter((item) => item.module.id === Number(moduleFilter))
  }, [portal.data, moduleFilter])

  function openSubmission(assignment: AssignmentDetail) {
    if (isPast(assignment.deadline)) {
      setError('The deadline for this assignment has passed.')
      return
    }
    const existing = submissionByAssignment.get(assignment.id)
    setActive(assignment)
    setContentUrl(existing?.content_url ?? '')
    setError(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!active) return
    setBusy(true)
    setError(null)
    try {
      await api.post<SubmissionRead>(
        `/students/me/assignments/${active.id}/submissions`,
        { content_url: contentUrl.trim() },
      )
      setActive(null)
      setContentUrl('')
      portal.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (portal.loading) {
    return <Spinner label="Loading assignments" />
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Coursework"
        title="Assignments"
        subtitle="Submit a link to your work before the deadline. You can update it until the deadline passes."
        action={
          <Select
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
            aria-label="Filter by module"
          >
            <option value="all">All modules</option>
            {(portal.data?.modules ?? []).map((module) => (
              <option key={module.id} value={module.id}>
                {module.module_name}
              </option>
            ))}
          </Select>
        }
      />

      {portal.error ? <Alert>{portal.error}</Alert> : null}
      {error && !active ? <Alert>{error}</Alert> : null}

      <Card>
        {assignments.length === 0 ? (
          <EmptyState
            title="No assignments to show"
            description="Your class has no published assignments for this filter yet."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Module</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th className="align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => {
                  const submission = submissionByAssignment.get(assignment.id)
                  const status = submissionStatus(assignment, submission)
                  const closed = isPast(assignment.deadline)
                  return (
                    <tr key={assignment.id}>
                      <td>
                        <div className="cell-main">
                          <strong>{assignment.title}</strong>
                          <small className="muted">
                            {assignment.teacher.full_name}
                          </small>
                          {assignment.description ? (
                            <small className="muted">
                              {assignment.description}
                            </small>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className="muted">
                          {assignment.module.module_code}
                        </span>
                        <div>{assignment.module.module_name}</div>
                      </td>
                      <td>
                        <div>{formatDate(assignment.deadline)}</div>
                        {closed ? (
                          <small className="muted">Closed</small>
                        ) : null}
                      </td>
                      <td>
                        <Badge tone={status.tone}>{status.label}</Badge>
                        {submission?.grade !== null &&
                        submission?.grade !== undefined ? (
                          <div className="small muted">
                            {gradeLabel(submission.grade)}
                          </div>
                        ) : null}
                        {submission ? (
                          <small className="muted">
                            {formatDateTime(submission.submitted_at)}
                          </small>
                        ) : null}
                      </td>
                      <td className="align-right">
                        <Button
                          size="sm"
                          variant={submission ? 'secondary' : 'primary'}
                          disabled={closed}
                          onClick={() => openSubmission(assignment)}
                        >
                          {closed
                            ? 'Closed'
                            : submission
                              ? 'Update'
                              : 'Submit'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={active !== null}
        title={active ? active.title : 'Submit assignment'}
        subtitle={
          active
            ? `${active.module.module_name} · due ${formatDate(active.deadline)}`
            : undefined
        }
        onClose={() => {
          setActive(null)
          setError(null)
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setActive(null)
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="submit-assignment-form"
              busy={busy}
              disabled={!contentUrl.trim()}
            >
              Submit work
            </Button>
          </>
        }
      >
        <form
          id="submit-assignment-form"
          className="form-stack"
          onSubmit={onSubmit}
        >
          {error ? <Alert>{error}</Alert> : null}
          <Field
            label="Work link"
            hint="Paste a link to your document, repository, or uploaded file."
          >
            <Textarea
              value={contentUrl}
              onChange={(event) => setContentUrl(event.target.value)}
              placeholder="https://..."
              rows={3}
              required
            />
          </Field>
          {active?.description ? (
            <div className="read-panel">
              <span className="eyebrow">Instructions</span>
              <p>{active.description}</p>
            </div>
          ) : null}
        </form>
      </Modal>
    </div>
  )
}
