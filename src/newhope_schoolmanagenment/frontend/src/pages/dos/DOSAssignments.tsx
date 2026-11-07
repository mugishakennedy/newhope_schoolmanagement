import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type {
  AssignmentRecord,
  ClassRead,
  ModuleRead,
  TeacherRead,
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
  assignments: AssignmentRecord[]
  classes: ClassRead[]
  modules: ModuleRead[]
  teachers: TeacherRead[]
}

export function DOSAssignments() {
  const data = useApi<AssignmentData>(async () => {
    const [assignments, classes, modules, teachers] = await Promise.all([
      api.get<AssignmentRecord[]>('/dos/assignments'),
      api.get<ClassRead[]>('/dos/classes').catch(() => []),
      api.get<ModuleRead[]>('/dos/modules').catch(() => []),
      api.get<TeacherRead[]>('/dos/teachers').catch(() => []),
    ])
    return { assignments, classes, modules, teachers }
  }, 'dos-assignments')

  const [open, setOpen] = useState(false)
  const [teacherId, setTeacherId] = useState('')
  const [classId, setClassId] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [editing, setEditing] = useState<AssignmentRecord | null>(null)
  const [editTeacherId, setEditTeacherId] = useState('')
  const [editClassId, setEditClassId] = useState('')
  const [editModuleId, setEditModuleId] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDeadline, setEditDeadline] = useState('')

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

  const teacherById = useMemo(() => {
    const map = new Map<number, TeacherRead>()
    for (const item of data.data?.teachers ?? []) map.set(item.id, item)
    return map
  }, [data.data])

  function reset() {
    setTeacherId('')
    setClassId('')
    setModuleId('')
    setTitle('')
    setDescription('')
    setDeadline('')
    setError(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api.post<AssignmentRecord>('/dos/assignments', {
        teacher_id: Number(teacherId),
        class_id: Number(classId),
        module_id: Number(moduleId),
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      })
      setOpen(false)
      reset()
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  function openEdit(assignment: AssignmentRecord) {
    setEditing(assignment)
    setEditTeacherId(String(assignment.teacher_id))
    setEditClassId(String(assignment.class_id))
    setEditModuleId(String(assignment.module_id))
    setEditTitle(assignment.title)
    setEditDescription(assignment.description ?? '')
    setEditDeadline(toDateTimeLocal(assignment.deadline))
    setError(null)
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setError(null)
    setBusy(true)
    try {
      await api.patch<AssignmentRecord>(
        `/dos/assignments/${editing.id}`,
        {
          teacher_id: Number(editTeacherId),
          class_id: Number(editClassId),
          module_id: Number(editModuleId),
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          deadline: editDeadline
            ? new Date(editDeadline).toISOString()
            : null,
        },
      )
      setEditing(null)
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(assignment: AssignmentRecord) {
    if (
      !window.confirm(
        `Delete "${assignment.title}"? All submissions for it will be removed.`,
      )
    ) {
      return
    }
    setError(null)
    try {
      await api.delete(`/dos/assignments/${assignment.id}`)
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  if (data.loading) return <Spinner label="Loading assignments" />
  if (data.error) return <Alert>{data.error}</Alert>

  const assignments = data.data?.assignments ?? []

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Coursework"
        title="Assignments"
        subtitle="Publish work for a teacher, module, and class. Teachers must already be assigned to that combination."
        action={<Button onClick={() => setOpen(true)}>Create assignment</Button>}
      />

      <Card>
        {assignments.length === 0 ? (
          <EmptyState
            title="No assignments yet"
            description="Create the first assignment after assigning teachers to modules and classes."
            action={
              <Button onClick={() => setOpen(true)}>Create assignment</Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Teacher</th>
                  <th>Module</th>
                  <th>Class</th>
                  <th>Deadline</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => {
                  const teacher = teacherById.get(assignment.teacher_id)
                  const module = moduleById.get(assignment.module_id)
                  const schoolClass = classById.get(assignment.class_id)
                  return (
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
                      <td>{teacher?.full_name ?? `#${assignment.teacher_id}`}</td>
                      <td>
                        <div>{module?.module_name ?? `#${assignment.module_id}`}</div>
                        <small className="muted">{module?.module_code}</small>
                      </td>
                      <td>{schoolClass?.class_name ?? `#${assignment.class_id}`}</td>
                      <td>
                        <Badge
                          tone={isPast(assignment.deadline) ? 'danger' : 'gold'}
                        >
                          {formatDate(assignment.deadline)}
                        </Badge>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        title="Create an assignment"
        subtitle="Only teachers assigned to the chosen module and class can receive it."
        onClose={() => {
          setOpen(false)
          reset()
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false)
                reset()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-assignment-form"
              busy={busy}
              disabled={!teacherId || !classId || !moduleId || !title.trim()}
            >
              Publish assignment
            </Button>
          </>
        }
      >
        <form
          id="create-assignment-form"
          className="form-stack"
          onSubmit={onSubmit}
        >
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Teacher">
            <Select
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              required
            >
              <option value="">Select a teacher</option>
              {(data.data?.teachers ?? []).map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} · {teacher.employee_code}
                </option>
              ))}
            </Select>
          </Field>
          <div className="form-grid">
            <Field label="Module">
              <Select
                value={moduleId}
                onChange={(event) => setModuleId(event.target.value)}
                required
              >
                <option value="">Select a module</option>
                {(data.data?.modules ?? []).map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.module_code} · {module.module_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Class">
              <Select
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                required
              >
                <option value="">Select a class</option>
                {(data.data?.classes ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.class_name} · {item.academic_year}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
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
        </form>
      </Modal>

      <Modal
        open={editing !== null}
        title="Edit assignment"
        subtitle="Changes apply immediately for students in the class."
        onClose={() => {
          setEditing(null)
          setError(null)
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(null)
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-assignment-form"
              busy={busy}
              disabled={
                !editTeacherId ||
                !editClassId ||
                !editModuleId ||
                !editTitle.trim()
              }
            >
              Save changes
            </Button>
          </>
        }
      >
        <form
          id="edit-assignment-form"
          className="form-stack"
          onSubmit={onEdit}
        >
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Teacher">
            <Select
              value={editTeacherId}
              onChange={(event) => setEditTeacherId(event.target.value)}
              required
            >
              <option value="">Select a teacher</option>
              {(data.data?.teachers ?? []).map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} · {teacher.employee_code}
                </option>
              ))}
            </Select>
          </Field>
          <div className="form-grid">
            <Field label="Module">
              <Select
                value={editModuleId}
                onChange={(event) => setEditModuleId(event.target.value)}
                required
              >
                <option value="">Select a module</option>
                {(data.data?.modules ?? []).map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.module_code} · {module.module_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Class">
              <Select
                value={editClassId}
                onChange={(event) => setEditClassId(event.target.value)}
                required
              >
                <option value="">Select a class</option>
                {(data.data?.classes ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.class_name} · {item.academic_year}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Title">
            <Input
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              required
            />
          </Field>
          <Field label="Description" hint="Optional instructions for students.">
            <Textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              rows={3}
            />
          </Field>
          <Field label="Deadline" hint="Optional. Submissions close after this time.">
            <Input
              type="datetime-local"
              value={editDeadline}
              onChange={(event) => setEditDeadline(event.target.value)}
            />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
