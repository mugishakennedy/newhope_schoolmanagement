import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type {
  AssignmentDetail,
  SubmissionWithStudent,
} from '../../api/types'
import { FilePreview } from '../../components/FilePreview'
import { QuizAttemptReview } from '../../components/QuizAttemptReview'
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
  assignments: AssignmentDetail[]
  submissions: SubmissionWithStudent[]
}

export function TeacherSubmissions() {
  const data = useApi<SubmissionData>(async () => {
    const [assignments, submissions] = await Promise.all([
      api.get<AssignmentDetail[]>('/teacher/assignments').catch(() => []),
      api.get<SubmissionWithStudent[]>('/teacher/submissions'),
    ])
    return { assignments, submissions }
  }, 'teacher-submissions')

  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState<SubmissionWithStudent | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const all = data.data?.submissions ?? []
    if (filter === 'all') return all
    return all.filter(
      (item) => item.assignment_id === Number(filter),
    )
  }, [data.data, filter])

  const ungraded = (data.data?.submissions ?? []).filter(
    (item) => item.grade === null || item.grade === undefined,
  ).length

  function openGrade(submission: SubmissionWithStudent) {
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
      await api.patch(`/teacher/submissions/${active.id}/grade`, {
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
        eyebrow="Feedback"
        title="Submissions"
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
            description="Student work will appear here as soon as it is submitted."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assignment</th>
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
                          <strong>{submission.student.full_name}</strong>
                          <small className="muted">
                            {submission.student.registration_no}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>{submission.assignment.title}</div>
                        <small className="muted">
                          {submission.assignment.module.module_name}
                        </small>
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
        title={active ? `Grade ${active.student.full_name}` : 'Grade submission'}
        subtitle={active ? active.assignment.title : undefined}
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
              form="grade-form"
              busy={busy}
              disabled={!grade}
            >
              Save grade
            </Button>
          </>
        }
      >
        <form id="grade-form" className="form-stack" onSubmit={onSubmit}>
          {error ? <Alert>{error}</Alert> : null}
          {active?.assignment.kind === 'quiz' ? (
            <QuizAttemptReview
              basePath="/teacher"
              assignmentId={active.assignment_id}
              submissionId={active.id}
            />
          ) : active ? (
            <>
              {active.answer_text ? (
                <div className="read-panel">
                  <span className="eyebrow">Student's answer</span>
                  <p className="submission-answer">{active.answer_text}</p>
                </div>
              ) : null}
              {active.content_url ? (
                <div className="read-panel">
                  <span className="eyebrow">Submitted work</span>
                  <FilePreview url={active.content_url} />
                </div>
              ) : null}
              {!active.answer_text && !active.content_url ? (
                <p className="muted">No work was attached to this submission.</p>
              ) : null}
            </>
          ) : null}
          <Field label="Grade" hint="A mark from 0 to 100.">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              placeholder="e.g. 85"
              required
            />
          </Field>
          <Field label="Feedback" hint="Optional notes for the student.">
            <Textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={4}
              placeholder="What went well? What should be improved?"
            />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
