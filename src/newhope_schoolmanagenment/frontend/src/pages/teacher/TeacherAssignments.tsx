import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type {
  AssignmentDetail,
  AssignmentKind,
  AssignmentRecord,
  ClassRead,
  ModuleRead,
  SubmissionWithStudent,
  TeacherModuleRead,
} from '../../api/types'
import { AssignmentAttachments } from '../../components/AssignmentAttachments'
import { uploadAssignmentFiles } from '../../utils/upload'
import { QuizBuilder } from '../../components/QuizBuilder'
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
import { formatDate, isPast, toDateTimeLocal } from '../../utils/format'

interface AssignmentData {
  assignments: AssignmentDetail[]
  submissions: SubmissionWithStudent[]
  links: TeacherModuleRead[]
  classes: ClassRead[]
  modules: ModuleRead[]
}

export function TeacherAssignments() {
  const data = useApi<AssignmentData>(async () => {
    const [assignments, submissions, links, classes, modules] =
      await Promise.all([
        api.get<AssignmentDetail[]>('/teacher/assignments'),
        api.get<SubmissionWithStudent[]>('/teacher/submissions').catch(() => []),
        api.get<TeacherModuleRead[]>('/teacher/teaching-links').catch(() => []),
        api.get<ClassRead[]>('/teacher/classes').catch(() => []),
        api.get<ModuleRead[]>('/teacher/modules').catch(() => []),
      ])
    return { assignments, submissions, links, classes, modules }
  }, 'teacher-assignments')

  const [classFilter, setClassFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AssignmentDetail | null>(null)
  const [linkKey, setLinkKey] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<AssignmentKind>('assignment')
  const [deadline, setDeadline] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [quizTarget, setQuizTarget] = useState<{
    id: number
    title: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const classById = useMemo(() => {
    const map = new Map<number, ClassRead>()
    for (const item of data.data?.classes ?? []) map.set(item.id, item)
    return map
  }, [data.data])

  const moduleById = useMemo(() => {
    const map = new Map<number, ModuleRead>()
    for (const item of data.data?.modules ?? []) map.set(item.id, item)
    return map
  }, [data.data])

  const classes = useMemo(() => {
    const ids = new Set<number>()
    for (const link of data.data?.links ?? []) ids.add(link.class_id)
    return Array.from(ids)
  }, [data.data])

  const submissionCount = useMemo(() => {
    const map = new Map<number, number>()
    for (const submission of data.data?.submissions ?? []) {
      map.set(
        submission.assignment_id,
        (map.get(submission.assignment_id) ?? 0) + 1,
      )
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

  function reset() {
    setLinkKey('')
    setTitle('')
    setDescription('')
    setKind('assignment')
    setDeadline('')
    setFiles([])
    setError(null)
  }

  function openCreate() {
    reset()
    setEditing(null)
    setOpen(true)
  }

  function openEdit(assignment: AssignmentDetail) {
    setEditing(assignment)
    setLinkKey(`${assignment.module.id}:${assignment.school_class.id}`)
    setTitle(assignment.title)
    setDescription(assignment.description ?? '')
    setKind(assignment.kind)
    setDeadline(toDateTimeLocal(assignment.deadline))
    setFiles([])
    setError(null)
    setOpen(true)
  }

  function parseLink(key: string): { moduleId: number; classId: number } {
    const [moduleId, classId] = key.split(':').map(Number)
    return { moduleId, classId }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { moduleId, classId } = parseLink(linkKey)
    if (!moduleId || !classId) {
      setError('Choose the module and class to teach.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const payload = {
        module_id: moduleId,
        class_id: classId,
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }
      let assignmentId: number
      if (editing) {
        await api.patch(`/teacher/assignments/${editing.id}`, payload)
        assignmentId = editing.id
        setNotice('Assignment updated.')
      } else {
        const created = await api.post<AssignmentRecord>(
          '/teacher/assignments',
          { ...payload, kind },
        )
        assignmentId = created.id
        setNotice('Assignment published.')
        if (kind === 'quiz') {
          setQuizTarget({ id: created.id, title: created.title })
        }
      }
      if (files.length > 0) {
        try {
          await uploadAssignmentFiles(
            '/teacher/assignments',
            assignmentId,
            files,
          )
        } catch (cause) {
          setNotice(
            `Assignment saved, but some resources failed to upload: ${errorMessage(cause)}`,
          )
        }
      }
      setOpen(false)
      setEditing(null)
      reset()
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(assignment: AssignmentDetail) {
    if (
      !window.confirm(
        `Delete "${assignment.title}"? All submissions for it will be removed.`,
      )
    ) {
      return
    }
    setError(null)
    setNotice(null)
    try {
      await api.delete(`/teacher/assignments/${assignment.id}`)
      setNotice('Assignment deleted.')
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  if (data.loading) return <Spinner label="Loading assignments" />
  if (data.error) return <Alert>{data.error}</Alert>

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Teaching"
        title="Assignments"
        subtitle="Publish coursework for the classes and modules you teach."
        action={
          <div className="row-actions">
            <Select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              aria-label="Filter by class"
            >
              <option value="all">All classes</option>
              {classes.map((id) => (
                <option key={id} value={id}>
                  {classById.get(id)?.class_name ?? `Class #${id}`}
                </option>
              ))}
            </Select>
            <Button onClick={openCreate}>Create assignment</Button>
          </div>
        }
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error && !open ? <Alert>{error}</Alert> : null}

      <Card>
        {assignments.length === 0 ? (
          <EmptyState
            title="No assignments"
            description="Create an assignment for one of your classes."
            action={<Button onClick={openCreate}>Create assignment</Button>}
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
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>
                      <div className="cell-main">
                        <strong>{assignment.title}</strong>
                        {assignment.kind === 'quiz' ? (
                          <Badge tone="info">Quiz</Badge>
                        ) : null}
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
                    <td className="align-right">
                      <div className="row-actions">
                        {assignment.kind === 'quiz' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setQuizTarget({
                                id: assignment.id,
                                title: assignment.title,
                              })
                            }
                          >
                            Build quiz
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEdit(assignment)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDelete(assignment)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        title={editing ? 'Edit assignment' : 'Create an assignment'}
        subtitle="Only classes and modules assigned to you are available."
        onClose={() => {
          setOpen(false)
          setEditing(null)
          reset()
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setEditing(null)
                reset()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="teacher-assignment-form"
              busy={busy}
              disabled={!linkKey || !title.trim()}
            >
              {editing ? 'Save changes' : 'Publish assignment'}
            </Button>
          </>
        }
      >
        <form
          id="teacher-assignment-form"
          className="form-stack"
          onSubmit={onSubmit}
        >
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Class">
            <Select
              value={linkKey}
              onChange={(event) => setLinkKey(event.target.value)}
              required
            >
              <option value="">Select what you teach</option>
              {(data.data?.links ?? []).map((link) => (
                <option
                  key={link.id}
                  value={`${link.module_id}:${link.class_id}`}
                >
                  {moduleById.get(link.module_id)?.module_name ??
                    `Module #${link.module_id}`}
                  {' · '}
                  {classById.get(link.class_id)?.class_name ??
                    `Class #${link.class_id}`}
                </option>
              ))}
            </Select>
          </Field>
          {!editing ? (
            <Field
              label="Mode"
              hint="Choose a file/link assignment or an online quiz."
            >
              <Select
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as AssignmentKind)
                }
              >
                <option value="assignment">
                  Assignment (file or link submission)
                </option>
                <option value="quiz">Quiz (online questions)</option>
              </Select>
            </Field>
          ) : null}
          <Field label="Title">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Algebra practice set"
              required
            />
          </Field>
          <Field label="Description" hint="Optional instructions for students.">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="What should students do?"
            />
          </Field>
          <Field label="Deadline" hint="Optional. Submissions close after this time.">
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </Field>
          <AssignmentAttachments
            basePath="/teacher/assignments"
            assignmentId={editing?.id ?? null}
            staged={files}
            onStagedChange={setFiles}
            onError={setError}
          />
          {(data.data?.links ?? []).length === 0 ? (
            <Alert tone="gold">
              You have no modules or classes assigned yet. Ask the DOS to
              assign you before publishing work.
            </Alert>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={quizTarget !== null}
        title={quizTarget ? `Quiz · ${quizTarget.title}` : 'Quiz'}
        subtitle="Build the questions students answer online. Objective questions are graded automatically."
        onClose={() => setQuizTarget(null)}
      >
        {quizTarget ? (
          <QuizBuilder
            basePath="/teacher/assignments"
            assignmentId={quizTarget.id}
            onSaved={() => data.reload()}
            onError={setError}
          />
        ) : null}
      </Modal>
    </div>
  )
}
