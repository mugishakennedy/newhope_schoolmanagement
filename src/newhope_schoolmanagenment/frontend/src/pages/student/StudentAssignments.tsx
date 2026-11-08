import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type {
  AssignmentAttachment,
  AssignmentDetail,
  ModuleRead,
  SubmissionRead,
  SubmissionWithAssignment,
} from '../../api/types'
import { FilePreview } from '../../components/FilePreview'
import { StudentQuiz } from '../../components/StudentQuiz'
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
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [contentUrl, setContentUrl] = useState('')
  const [answer, setAnswer] = useState('')
  const [file, setFile] = useState<File | null>(null)
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
    const existing = submissionByAssignment.get(assignment.id)
    setActive(assignment)
    setContentUrl(existing?.content_url ?? '')
    setAnswer(existing?.answer_text ?? '')
    setFile(null)
    setError(null)
    setAttachments([])
    setAttachmentsLoading(true)
    api
      .get<AssignmentAttachment[]>(
        `/students/me/assignments/${assignment.id}/attachments`,
      )
      .then(setAttachments)
      .catch((cause) => setError(errorMessage(cause)))
      .finally(() => setAttachmentsLoading(false))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!active || isPast(active.deadline)) return
    setBusy(true)
    setError(null)
    try {
      const answerText = answer.trim()
      if (file) {
        const body = new FormData()
        body.append('file', file)
        if (answerText) body.append('answer_text', answerText)
        await api.upload<SubmissionRead>(
          `/students/me/assignments/${active.id}/submissions/upload`,
          body,
        )
      } else {
        await api.post<SubmissionRead>(
          `/students/me/assignments/${active.id}/submissions`,
          {
            content_url: contentUrl.trim() || null,
            answer_text: answerText || null,
          },
        )
      }
      setActive(null)
      setContentUrl('')
      setAnswer('')
      setFile(null)
      setAttachments([])
      portal.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const closed = active ? isPast(active.deadline) : false
  const activeSubmission = active
    ? submissionByAssignment.get(active.id)
    : undefined
  const activeHasGrade =
    activeSubmission?.grade !== null && activeSubmission?.grade !== undefined

  function renderResources() {
    if (attachmentsLoading) {
      return <p className="muted">Loading resources...</p>
    }
    if (attachments.length === 0) {
      return <p className="muted">No files attached to this assignment.</p>
    }
    return (
      <div className="attachment-list">
        {attachments.map((attachment) => (
          <FilePreview
            key={attachment.id}
            url={attachment.content_url}
            name={attachment.original_name}
            contentType={attachment.content_type}
          />
        ))}
      </div>
    )
  }

  if (portal.loading) {
    return <Spinner label="Loading assignments" />
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Coursework"
        title="Assignments"
        subtitle="Read the assessment, write your answer, and submit before the deadline. Submitted work is final, so you will wait for your grade."
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
                  const isClosed = isPast(assignment.deadline)
                  return (
                    <tr key={assignment.id}>
                      <td>
                        <div className="cell-main">
                          <strong>{assignment.title}</strong>
                          {assignment.kind === 'quiz' ? (
                            <Badge tone="info">Quiz</Badge>
                          ) : null}
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
                        {isClosed ? (
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
                          variant={submission || isClosed ? 'secondary' : 'primary'}
                          onClick={() => openSubmission(assignment)}
                        >
                          {isClosed
                            ? 'View'
                            : assignment.kind === 'quiz'
                              ? submission
                                ? 'View result'
                                : 'Start quiz'
                              : submission
                                ? 'View'
                                : 'Open'}
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
          setFile(null)
          setAnswer('')
          setError(null)
          setAttachments([])
          setAttachmentsLoading(false)
        }}
        footer={
          active?.kind === 'quiz' ? undefined : activeSubmission ? (
            <Button
              variant="secondary"
              onClick={() => {
                setActive(null)
                setFile(null)
                setAnswer('')
                setError(null)
                setAttachments([])
                setAttachmentsLoading(false)
              }}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setActive(null)
                  setFile(null)
                  setAnswer('')
                  setError(null)
                  setAttachments([])
                  setAttachmentsLoading(false)
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="submit-assignment-form"
                busy={busy}
                disabled={
                  closed ||
                  (!file && !contentUrl.trim() && !answer.trim())
                }
              >
                Submit work
              </Button>
            </>
          )
        }
      >
        {active?.kind === 'quiz' ? (
          <StudentQuiz
            assignment={active}
            onSubmitted={() => {
              portal.reload()
              setActive(null)
            }}
          />
        ) : activeSubmission ? (
          <div className="form-stack">
            {active?.description ? (
              <div className="read-panel">
                <span className="eyebrow">Assessment</span>
                <p>{active.description}</p>
              </div>
            ) : null}
            <div className="read-panel">
              <span className="eyebrow">Your answer</span>
              {activeSubmission.answer_text ? (
                <p className="submission-answer">
                  {activeSubmission.answer_text}
                </p>
              ) : (
                <p className="muted">No written answer was submitted.</p>
              )}
              {activeSubmission.content_url ? (
                <FilePreview url={activeSubmission.content_url} />
              ) : null}
            </div>
            <div className="read-panel">
              <span className="eyebrow">Grade</span>
              {activeHasGrade ? (
                <>
                  <p>{gradeLabel(activeSubmission.grade)}</p>
                  {activeSubmission.feedback ? (
                    <p className="muted">{activeSubmission.feedback}</p>
                  ) : null}
                </>
              ) : (
                <p className="muted">
                  Waiting for your teacher to grade this submission.
                </p>
              )}
            </div>
            <p className="muted">
              Submitted {formatDateTime(activeSubmission.submitted_at)}.
              Submitted work is final and cannot be changed.
            </p>
            <div className="read-panel">
              <span className="eyebrow">Resources</span>
              {renderResources()}
            </div>
          </div>
        ) : (
        <form
          id="submit-assignment-form"
          className="form-stack"
          onSubmit={onSubmit}
        >
          {closed ? (
            <Alert tone="gold">
              The deadline for this assignment has passed. You can still read
              the assessment and download the resources below.
            </Alert>
          ) : null}
          {error ? <Alert>{error}</Alert> : null}
          {active?.description ? (
            <div className="read-panel">
              <span className="eyebrow">Assessment</span>
              <p>{active.description}</p>
            </div>
          ) : null}
          <Field
            label="Your answer"
            hint="Type your answer here. You can also attach a file or add a link below."
          >
            <Textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Write your answer..."
              rows={6}
              disabled={closed}
            />
          </Field>
          <Field
            label="Upload a file (optional)"
            hint="Choose a file from your device. Maximum size is 25 MB."
          >
            <input
              className="file-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.png,.jpg,.jpeg,.gif,.webp"
              disabled={closed}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </Field>
          <Field
            label="Or link to your work (optional)"
            hint="Paste a link to a document or repository instead of uploading."
          >
            <Textarea
              value={contentUrl}
              onChange={(event) => setContentUrl(event.target.value)}
              placeholder="https://..."
              rows={3}
              disabled={closed || file !== null}
            />
          </Field>
          {file ? (
            <div className="read-panel">
              <span className="eyebrow">Selected file</span>
              <p>{file.name}</p>
            </div>
          ) : null}
          <div className="read-panel">
            <span className="eyebrow">Resources</span>
            {renderResources()}
          </div>
        </form>
        )}
      </Modal>
    </div>
  )
}
