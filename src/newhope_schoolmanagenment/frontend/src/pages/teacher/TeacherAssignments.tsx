import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type {
  AssignmentAttachment,
  AssignmentDetail,
  AssignmentKind,
  AssignmentRecord,
  ClassRead,
  ModuleRead,
  SubmissionWithStudent,
  TeacherModuleOption,
} from '../../api/types'
import { AssignmentAttachments } from '../../components/AssignmentAttachments'
import { AssignmentPreview } from '../../components/AssignmentPreview'
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
  options: TeacherModuleOption[]
}

export function TeacherAssignments() {
  const data = useApi<AssignmentData>(async () => {
    const [assignments, submissions, options] = await Promise.all([
      api.get<AssignmentDetail[]>('/teacher/assignments'),
      api.get<SubmissionWithStudent[]>('/teacher/submissions').catch(() => []),
      api
        .get<TeacherModuleOption[]>('/teacher/assignment-options')
        .catch(() => []),
    ])
    return { assignments, submissions, options }
  }, 'teacher-assignments')

  const [classFilter, setClassFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AssignmentDetail | null>(null)
  const [classId, setClassId] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<AssignmentKind>('assignment')
  const [deadline, setDeadline] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [editAttachments, setEditAttachments] = useState<
    AssignmentAttachment[]
  >([])
  const [previewDraft, setPreviewDraft] = useState(false)
  const [viewTarget, setViewTarget] = useState<AssignmentDetail | null>(null)
  const [viewAttachments, setViewAttachments] = useState<
    AssignmentAttachment[]
  >([])
  const [viewLoading, setViewLoading] = useState(false)
  const [quizTarget, setQuizTarget] = useState<{
    id: number
    title: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const courses = useMemo(() => {
    const map = new Map<number, ClassRead>()
    for (const option of data.data?.options ?? []) {
      map.set(option.school_class.id, option.school_class)
    }
    return Array.from(map.values())
  }, [data.data])

  const modulesForCourse = useMemo(() => {
    if (!classId) return []
    const map = new Map<number, ModuleRead>()
    for (const option of data.data?.options ?? []) {
      if (option.school_class.id === Number(classId)) {
        map.set(option.module.id, option.module)
      }
    }
    return Array.from(map.values())
  }, [data.data, classId])

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
    setClassId('')
    setModuleId('')
    setTitle('')
    setDescription('')
    setKind('assignment')
    setDeadline('')
    setFiles([])
    setEditAttachments([])
    setPreviewDraft(false)
    setError(null)
  }

  function close() {
    setOpen(false)
    setEditing(null)
    reset()
  }

  function openCreate() {
    reset()
    setEditing(null)
    setOpen(true)
  }

  function openEdit(assignment: AssignmentDetail) {
    setEditing(assignment)
    setClassId(String(assignment.school_class.id))
    setModuleId(String(assignment.module.id))
    setTitle(assignment.title)
    setDescription(assignment.description ?? '')
    setKind(assignment.kind)
    setDeadline(toDateTimeLocal(assignment.deadline))
    setFiles([])
    setEditAttachments([])
    setPreviewDraft(false)
    setError(null)
    setOpen(true)
    api
      .get<AssignmentAttachment[]>(
        `/teacher/assignments/${assignment.id}/attachments`,
      )
      .then(setEditAttachments)
      .catch(() => setEditAttachments([]))
  }

  async function openView(assignment: AssignmentDetail) {
    setViewTarget(assignment)
    setViewAttachments([])
    setViewLoading(true)
    try {
      const list = await api.get<AssignmentAttachment[]>(
        `/teacher/assignments/${assignment.id}/attachments`,
      )
      setViewAttachments(list)
    } catch {
      setViewAttachments([])
    } finally {
      setViewLoading(false)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedClassId = Number(classId)
    const selectedModuleId = Number(moduleId)
    if (!selectedClassId || !selectedModuleId) {
      setError('Choose the course and module for this assignment.')
      return
    }

    setError(null)
    setBusy(true)
    try {
      const payload = {
        class_id: selectedClassId,
        module_id: selectedModuleId,
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
      close()
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

  const canCreate = courses.length > 0

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Teaching"
        title="Assignments"
        subtitle="Create and manage assignments for courses and modules assigned to you."
        action={
          <>
            <Select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              aria-label="Filter by course"
            >
              <option value="all">All courses</option>
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.class_name} · {item.academic_year}
                </option>
              ))}
            </Select>
            <Button onClick={openCreate} disabled={!canCreate}>
              Create assignment
            </Button>
          </>
        }
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error && !open ? <Alert>{error}</Alert> : null}

      <Card>
        {assignments.length === 0 ? (
          <EmptyState
            title="No assignments yet"
            description={
              canCreate
                ? 'Create the first assignment for one of your courses.'
                : 'The DOS has not assigned any courses and modules to you yet.'
            }
            action={
              canCreate ? (
                <Button onClick={openCreate}>Create assignment</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Module</th>
                  <th>Course</th>
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openView(assignment)}
                        >
                          View
                        </Button>
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
        subtitle="Choose the course first. Modules are limited to those the DOS assigned to you."
        onClose={close}
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="teacher-assignment-form"
              busy={busy}
              disabled={!classId || !moduleId || !title.trim()}
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
          <Field
            label="Course"
            hint="Choose a course assigned to you by the DOS."
          >
            <Select
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value)
                setModuleId('')
              }}
              required
            >
              <option value="">Choose a course first</option>
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.class_name} · {item.academic_year}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Module"
            hint={
              classId
                ? 'Only modules assigned to you for this course are shown.'
                : 'Choose a course first to load its modules.'
            }
          >
            <Select
              value={moduleId}
              onChange={(event) => setModuleId(event.target.value)}
              disabled={!classId}
              required
            >
              <option value="">
                {classId ? 'Select a module' : 'Choose a course first'}
              </option>
              {modulesForCourse.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.module_code} · {module.module_name}
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
              placeholder="e.g. Chapter 4 problem set"
              required
            />
          </Field>
          <Field
            label="Assessment / instructions"
            hint="Optional. Tell students what to do, what is assessed, and how to answer."
          >
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder="Write the assessment or instructions for this assignment..."
            />
          </Field>
          <Field
            label="Deadline"
            hint="Optional. Submissions close after this time."
          >
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
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPreviewDraft((value) => !value)}
          >
            {previewDraft ? 'Hide preview' : 'Preview as student'}
          </Button>
          {previewDraft ? (
            <AssignmentPreview
              title={title}
              description={description}
              kind={editing?.kind ?? kind}
              deadline={deadline ? new Date(deadline).toISOString() : null}
              moduleLabel={
                modulesForCourse.find((item) => item.id === Number(moduleId))
                  ?.module_name
              }
              courseLabel={
                courses.find((item) => item.id === Number(classId))?.class_name
              }
              attachments={editAttachments}
              staged={files}
            />
          ) : null}
          {!canCreate ? (
            <Alert tone="gold">
              You have no courses or modules assigned yet. Ask the DOS to assign
              you before publishing work.
            </Alert>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={viewTarget !== null}
        title={viewTarget ? viewTarget.title : 'Assignment'}
        subtitle={
          viewTarget
            ? `${viewTarget.module.module_name} · ${viewTarget.school_class.class_name}`
            : undefined
        }
        onClose={() => setViewTarget(null)}
        footer={
          <Button variant="secondary" onClick={() => setViewTarget(null)}>
            Close
          </Button>
        }
      >
        {viewLoading ? (
          <Spinner label="Loading assignment" />
        ) : viewTarget ? (
          <AssignmentPreview
            title={viewTarget.title}
            description={viewTarget.description}
            kind={viewTarget.kind}
            deadline={viewTarget.deadline}
            moduleLabel={viewTarget.module.module_name}
            courseLabel={viewTarget.school_class.class_name}
            attachments={viewAttachments}
          />
        ) : null}
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
