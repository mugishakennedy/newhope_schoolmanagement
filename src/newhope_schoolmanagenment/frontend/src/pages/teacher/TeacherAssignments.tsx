import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type {
  AssignmentDetail,
  ClassRead,
  ModuleRead,
  SubmissionWithStudent,
<<<<<<< HEAD
  TeacherModuleRead,
=======
  TeacherModuleOption,
>>>>>>> bcefb46 (new_upd)
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
<<<<<<< HEAD
  links: TeacherModuleRead[]
  classes: ClassRead[]
  modules: ModuleRead[]
=======
  options: TeacherModuleOption[]
>>>>>>> bcefb46 (new_upd)
}

export function TeacherAssignments() {
  const data = useApi<AssignmentData>(async () => {
<<<<<<< HEAD
    const [assignments, submissions, links, classes, modules] =
      await Promise.all([
        api.get<AssignmentDetail[]>('/teacher/assignments'),
        api.get<SubmissionWithStudent[]>('/teacher/submissions').catch(() => []),
        api.get<TeacherModuleRead[]>('/teacher/teaching-links').catch(() => []),
        api.get<ClassRead[]>('/teacher/classes').catch(() => []),
        api.get<ModuleRead[]>('/teacher/modules').catch(() => []),
      ])
    return { assignments, submissions, links, classes, modules }
=======
    const [assignments, submissions, options] = await Promise.all([
      api.get<AssignmentDetail[]>('/teacher/assignments'),
      api.get<SubmissionWithStudent[]>('/teacher/submissions').catch(() => []),
      api
        .get<TeacherModuleOption[]>('/teacher/assignment-options')
        .catch(() => []),
    ])
    return { assignments, submissions, options }
>>>>>>> bcefb46 (new_upd)
  }, 'teacher-assignments')

  const [classFilter, setClassFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AssignmentDetail | null>(null)
  const [linkKey, setLinkKey] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
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

<<<<<<< HEAD
  const classes = useMemo(() => {
    const ids = new Set<number>()
    for (const link of data.data?.links ?? []) ids.add(link.class_id)
    return Array.from(ids)
=======
  const [open, setOpen] = useState(false)
  const [classId, setClassId] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const courses = useMemo(() => {
    const map = new Map<number, { id: number; label: string }>()
    for (const option of data.data?.options ?? []) {
      const item = option.school_class
      map.set(item.id, {
        id: item.id,
        label: `${item.class_name} · ${item.academic_year}`,
      })
    }
    return Array.from(map.values())
>>>>>>> bcefb46 (new_upd)
  }, [data.data])

  const modulesForCourse = useMemo(() => {
    if (!classId) return []
    return (data.data?.options ?? [])
      .filter((option) => option.school_class.id === Number(classId))
      .map((option) => option.module)
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
<<<<<<< HEAD
    setLinkKey('')
=======
    setClassId('')
    setModuleId('')
>>>>>>> bcefb46 (new_upd)
    setTitle('')
    setDescription('')
    setDeadline('')
    setError(null)
  }

<<<<<<< HEAD
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
    setDeadline(toDateTimeLocal(assignment.deadline))
    setError(null)
    setOpen(true)
  }

  function parseLink(key: string): { moduleId: number; classId: number } {
    const [moduleId, classId] = key.split(':').map(Number)
    return { moduleId, classId }
=======
  function close() {
    setOpen(false)
    reset()
>>>>>>> bcefb46 (new_upd)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
<<<<<<< HEAD
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
      if (editing) {
        await api.patch(`/teacher/assignments/${editing.id}`, payload)
        setNotice('Assignment updated.')
      } else {
        await api.post('/teacher/assignments', payload)
        setNotice('Assignment published.')
      }
      setOpen(false)
      setEditing(null)
=======
    setError(null)
    setBusy(true)
    try {
      await api.post('/teacher/assignments', {
        class_id: Number(classId),
        module_id: Number(moduleId),
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      })
      setOpen(false)
>>>>>>> bcefb46 (new_upd)
      reset()
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

<<<<<<< HEAD
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

=======
>>>>>>> bcefb46 (new_upd)
  if (data.loading) return <Spinner label="Loading assignments" />
  if (data.error) return <Alert>{data.error}</Alert>

  const canCreate = courses.length > 0

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Teaching"
        title="Assignments"
<<<<<<< HEAD
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
=======
        subtitle="Assignments for your courses. Create one by choosing the course first, then the module."
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
                  {item.label}
                </option>
              ))}
            </Select>
            <Button onClick={() => setOpen(true)} disabled={!canCreate}>
              Create assignment
            </Button>
          </>
>>>>>>> bcefb46 (new_upd)
        }
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error && !open ? <Alert>{error}</Alert> : null}

      <Card>
        {assignments.length === 0 ? (
          <EmptyState
<<<<<<< HEAD
            title="No assignments"
            description="Create an assignment for one of your classes."
            action={<Button onClick={openCreate}>Create assignment</Button>}
=======
            title="No assignments yet"
            description={
              canCreate
                ? 'Create the first assignment for one of your courses.'
                : 'The DOS has not assigned any courses and modules to you yet.'
            }
            action={
              canCreate ? (
                <Button onClick={() => setOpen(true)}>Create assignment</Button>
              ) : undefined
            }
>>>>>>> bcefb46 (new_upd)
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
<<<<<<< HEAD
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
=======
        title="Create an assignment"
        subtitle="Choose the course first. Modules are limited to those the DOS assigned to you."
        onClose={close}
        footer={
          <>
            <Button variant="ghost" onClick={close}>
>>>>>>> bcefb46 (new_upd)
              Cancel
            </Button>
            <Button
              type="submit"
              form="teacher-assignment-form"
              busy={busy}
<<<<<<< HEAD
              disabled={!linkKey || !title.trim()}
            >
              {editing ? 'Save changes' : 'Publish assignment'}
=======
              disabled={!classId || !moduleId || !title.trim()}
            >
              Publish assignment
>>>>>>> bcefb46 (new_upd)
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
<<<<<<< HEAD
          <Field label="Module and class">
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
=======
          <Field
            label="Course"
            hint="Courses are set up by the DOS. Choose the course you are teaching."
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
                  {item.label}
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
>>>>>>> bcefb46 (new_upd)
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
<<<<<<< HEAD
              placeholder="e.g. Algebra practice set"
=======
              placeholder="e.g. Chapter 4 problem set"
>>>>>>> bcefb46 (new_upd)
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
<<<<<<< HEAD
          {(data.data?.links ?? []).length === 0 ? (
            <Alert tone="gold">
              You have no modules or classes assigned yet. Ask the DOS to
              assign you before publishing work.
            </Alert>
          ) : null}
=======
>>>>>>> bcefb46 (new_upd)
        </form>
      </Modal>
    </div>
  )
}
