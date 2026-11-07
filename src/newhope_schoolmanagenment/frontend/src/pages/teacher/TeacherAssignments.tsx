import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type {
  AssignmentDetail,
  ClassRead,
  ModuleRead,
  SubmissionWithStudent,
  TeacherModuleOption,
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
  const [deadline, setDeadline] = useState('')
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
    setDeadline('')
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
    setDeadline(toDateTimeLocal(assignment.deadline))
    setError(null)
    setOpen(true)
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
      if (editing) {
        await api.patch(`/teacher/assignments/${editing.id}`, payload)
        setNotice('Assignment updated.')
      } else {
        await api.post('/teacher/assignments', payload)
        setNotice('Assignment published.')
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
          <Field label="Title">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Chapter 4 problem set"
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
          {!canCreate ? (
            <Alert tone="gold">
              You have no courses or modules assigned yet. Ask the DOS to assign
              you before publishing work.
            </Alert>
          ) : null}
        </form>
      </Modal>
    </div>
  )
}
