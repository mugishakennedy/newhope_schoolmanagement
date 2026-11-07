import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type { ClassRead, StudentRead } from '../../api/types'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
<<<<<<< HEAD
  Input,
=======
>>>>>>> bcefb46 (new_upd)
  Modal,
  PageHeader,
  Select,
  Spinner,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../utils/format'

interface StudentData {
  students: StudentRead[]
  classes: ClassRead[]
}

export function DOSStudents() {
  const data = useApi<StudentData>(async () => {
    const [students, classes] = await Promise.all([
      api.get<StudentRead[]>('/dos/students'),
      api.get<ClassRead[]>('/dos/classes').catch(() => []),
    ])
    return { students, classes }
  }, 'dos-students')

<<<<<<< HEAD
  const [editing, setEditing] = useState<StudentRead | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [registrationNo, setRegistrationNo] = useState('')
  const [classId, setClassId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
=======
  const [target, setTarget] = useState<StudentRead | null>(null)
  const [classId, setClassId] = useState('')
  const [error, setError] = useState<string | null>(null)
>>>>>>> bcefb46 (new_upd)
  const [busy, setBusy] = useState(false)

  const classById = useMemo(() => {
    const map = new Map<number, ClassRead>()
    for (const item of data.data?.classes ?? []) {
      map.set(item.id, item)
    }
    return map
  }, [data.data])

<<<<<<< HEAD
  function openEdit(student: StudentRead) {
    setEditing(student)
    setFullName(student.full_name)
    setEmail(student.email)
    setRegistrationNo(student.registration_no)
    setClassId(student.class_id === null ? '' : String(student.class_id))
    setPassword('')
    setError(null)
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setError(null)
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        full_name: fullName.trim(),
        email: email.trim(),
        registration_no: registrationNo.trim(),
        class_id: classId ? Number(classId) : null,
      }
      if (password) payload.password = password
      await api.patch<StudentRead>(
        `/dos/students/${editing.id}`,
        payload,
      )
      setEditing(null)
      setNotice('Student updated.')
=======
  function openAssign(student: StudentRead) {
    setTarget(student)
    setClassId(student.class_id !== null ? String(student.class_id) : '')
    setError(null)
  }

  async function onAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!target) return
    setError(null)
    setBusy(true)
    try {
      await api.patch<StudentRead>(`/dos/students/${target.id}`, {
        class_id: classId ? Number(classId) : null,
      })
      setTarget(null)
>>>>>>> bcefb46 (new_upd)
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

<<<<<<< HEAD
  async function onDelete(student: StudentRead) {
    if (
      !window.confirm(
        `Delete ${student.full_name}? Their account and submissions will be removed.`,
      )
    ) {
      return
    }
    setError(null)
    setNotice(null)
    try {
      await api.delete(`/dos/students/${student.id}`)
      setNotice('Student deleted.')
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

=======
>>>>>>> bcefb46 (new_upd)
  if (data.loading) return <Spinner label="Loading students" />
  if (data.error) return <Alert>{data.error}</Alert>

  const students = data.data?.students ?? []
  const withoutClass = students.filter((item) => item.class_id === null).length

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Students"
        title="Student register"
        subtitle="Students create their own accounts. Place them in a class so they receive the right assignments."
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error && !editing ? <Alert>{error}</Alert> : null}

      <div className="stats-grid stats-grid-3">
        <div className="stat-card stat-info">
          <span className="stat-label">Registered</span>
          <strong className="stat-value">{students.length}</strong>
          <span className="stat-hint">Student accounts</span>
        </div>
        <div className="stat-card stat-gold">
          <span className="stat-label">Without a class</span>
          <strong className="stat-value">{withoutClass}</strong>
          <span className="stat-hint">Need placement</span>
        </div>
        <div className="stat-card stat-success">
          <span className="stat-label">Classes</span>
          <strong className="stat-value">{data.data?.classes.length ?? 0}</strong>
          <span className="stat-hint">Available</span>
        </div>
      </div>

      <Card>
        {students.length === 0 ? (
          <EmptyState
            title="No students registered"
            description="Students will appear here after they create their own accounts."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>STP number</th>
                  <th>Class</th>
                  <th>Email</th>
                  <th>Registered</th>
<<<<<<< HEAD
                  <th className="align-right">Actions</th>
=======
                  <th className="align-right">Action</th>
>>>>>>> bcefb46 (new_upd)
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const schoolClass =
                    student.class_id !== null
                      ? classById.get(student.class_id)
                      : undefined
                  return (
                    <tr key={student.id}>
                      <td>
                        <strong>{student.full_name}</strong>
                      </td>
                      <td>
                        <Badge tone="gold">{student.registration_no}</Badge>
                      </td>
                      <td>
                        {schoolClass ? (
                          <div>
                            {schoolClass.class_name}
                            <small className="muted block">
                              {schoolClass.academic_year}
                            </small>
                          </div>
                        ) : (
                          <span className="muted">Not assigned</span>
                        )}
                      </td>
                      <td>{student.email}</td>
                      <td className="muted">
                        {formatDate(student.created_at)}
                      </td>
                      <td className="align-right">
<<<<<<< HEAD
                        <div className="row-actions">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEdit(student)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onDelete(student)}
                          >
                            Delete
                          </Button>
                        </div>
=======
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openAssign(student)}
                        >
                          {student.class_id !== null
                            ? 'Change class'
                            : 'Assign class'}
                        </Button>
>>>>>>> bcefb46 (new_upd)
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
<<<<<<< HEAD
        open={editing !== null}
        title="Edit student"
        subtitle="Update details or place the student in a class."
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
              form="edit-student-form"
              busy={busy}
              disabled={
                !fullName.trim() || !email.trim() || !registrationNo.trim()
              }
            >
              Save changes
=======
        open={target !== null}
        title={target ? `Place ${target.full_name}` : 'Assign class'}
        subtitle="The student will immediately see assignments for this class."
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" form="assign-student-form" busy={busy}>
              Save placement
>>>>>>> bcefb46 (new_upd)
            </Button>
          </>
        }
      >
<<<<<<< HEAD
        <form id="edit-student-form" className="form-stack" onSubmit={onEdit}>
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Full name">
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </Field>
          <div className="form-grid">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            <Field label="STP number">
              <Input
                value={registrationNo}
                onChange={(event) => setRegistrationNo(event.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="Class">
=======
        <form id="assign-student-form" className="form-stack" onSubmit={onAssign}>
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Class" hint="Leave empty to unassign the student.">
>>>>>>> bcefb46 (new_upd)
            <Select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
            >
              <option value="">Not assigned</option>
              {(data.data?.classes ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.class_name} · {item.academic_year}
                </option>
              ))}
            </Select>
          </Field>
<<<<<<< HEAD
          <Field label="New password" hint="Optional. At least 8 characters.">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              placeholder="Leave empty to keep current"
            />
          </Field>
=======
>>>>>>> bcefb46 (new_upd)
        </form>
      </Modal>
    </div>
  )
}
