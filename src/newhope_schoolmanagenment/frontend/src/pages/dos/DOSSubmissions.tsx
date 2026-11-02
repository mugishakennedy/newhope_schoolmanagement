import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type {
  AssignmentRecord,
  StudentRead,
  SubmissionRead,
} from '../../api/types'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, gradeLabel } from '../../utils/format'

interface SubmissionData {
  submissions: SubmissionRead[]
  assignments: AssignmentRecord[]
  students: StudentRead[]
}

export function DOSSubmissions() {
  const data = useApi<SubmissionData>(async () => {
    const [submissions, assignments, students] = await Promise.all([
      api.get<SubmissionRead[]>('/dos/submissions'),
      api.get<AssignmentRecord[]>('/dos/assignments').catch(() => []),
      api.get<StudentRead[]>('/dos/students').catch(() => []),
    ])
    return { submissions, assignments, students }
  }, 'dos-submissions')

  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState<SubmissionRead | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const all = data.data?.submissions ?? []
    if (filter === 'all') return all
    return all.filter((item) => item.assignment_id === Number(filter))
  }, [data.data, filter])

  const ungraded = (data.data?.submissions ?? []).filter(
    (item) => item.grade === null || item.grade === undefined,
  ).length

  const assignmentTitle = (id: number) =>
    data.data?.assignments.find((item) => item.id === id)?.title ??
    `Assignment ${id}`

  const studentById = useMemo(() => {
    const map = new Map<number, StudentRead>()
    for (const item of data.data?.students ?? []) map.set(item.id, item)
    return map
  }, [data.data])

  function openGrade(submission: SubmissionRead) {
    setActive(submission)
    setGrade(
      submission.grade === null || submission.grade === undefined
        ? ''
        : String(submission.grade),
    )
    setFeedback(submission.feedback ?? '')
    setError(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!active) return
    const value = Number(grade)
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setError('Enter a grade between 0 and 100.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.patch(`/dos/submissions/${active.id}/grade`, {
        grade: value,
        feedback: feedback.trim() || null,
      })
      setActive(null)
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (data.loading) return <Spinner label="Loading submissions" />
  if (data.error) return <Alert>{data.error}</Alert>

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Grading"
        title="All submissions"
        subtitle={`${filtered.length} submission${filtered.length === 1 ? '' : 's'} shown · ${ungraded} awaiting a grade`}
        action={
          <Select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter by assignment"
          >
            <option value="all">All assignments</option>
            {(data.data?.assignments ?? []).map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </Select>
        }
      />

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="No submissions"
            description="No work has been submitted for the selected assignment yet."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Student</th>
                  <th>Submitted</th>
                  <th>Grade</th>
                  <th className="align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((submission) => {
                  const hasGrade =
                    submission.grade !== null && submission.grade !== undefined
                  return (
                    <tr key={submission.id}>
                      <td>
                        <div className="cell-main">
                          <strong>{assignmentTitle(submission.assignment_id)}</strong>
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
                      <td>
                        <div className="cell-main">
                          <strong>
                            {studentById.get(submission.student_id)?.full_name ??
                              `Student #${submission.student_id}`}
                          </strong>
                          <small className="muted">
                            {studentById.get(submission.student_id)
                              ?.registration_no ?? ''}
                          </small>
                        </div>
                      </td>
                      <td>{formatDateTime(submission.submitted_at)}</td>
                      <td>
                        <Badge tone={hasGrade ? 'success' : 'neutral'}>
                          {gradeLabel(submission.grade)}
                        </Badge>
                      </td>
                      <td className="align-right">
                        <Button
                          size="sm"
                          variant={hasGrade ? 'secondary' : 'primary'}
                          onClick={() => openGrade(submission)}
                        >
                          {hasGrade ? 'Update grade' : 'Grade'}
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
        title={active ? `Grade submission #${active.id}` : 'Grade submission'}
        subtitle={active ? assignmentTitle(active.assignment_id) : undefined}
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
              form="dos-grade-form"
              busy={busy}
              disabled={!grade}
            >
              Save grade
            </Button>
          </>
        }
      >
        <form id="dos-grade-form" className="form-stack" onSubmit={onSubmit}>
          {error ? <Alert>{error}</Alert> : null}
          {active ? (
            <a
              href={active.content_url}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Open submitted work
            </a>
          ) : null}
          <Field label="Grade" hint="A mark from 0 to 100.">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              required
            />
          </Field>
          <Field label="Feedback">
            <Textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={4}
              placeholder="Add feedback for the student."
            />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
