import { useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type {
  ClassRead,
  ModuleRead,
  TeacherModuleRead,
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
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../utils/format'

interface TeacherData {
  teachers: TeacherRead[]
  modules: ModuleRead[]
  classes: ClassRead[]
}

export function DOSTeachers() {
  const data = useApi<TeacherData>(async () => {
    const [teachers, modules, classes] = await Promise.all([
      api.get<TeacherRead[]>('/dos/teachers'),
      api.get<ModuleRead[]>('/dos/modules').catch(() => []),
      api.get<ClassRead[]>('/dos/classes').catch(() => []),
    ])
    return { teachers, modules, classes }
  }, 'dos-teachers')

  const [createOpen, setCreateOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<TeacherRead | null>(null)
  const [editTarget, setEditTarget] = useState<TeacherRead | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [password, setPassword] = useState('')

  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editPassword, setEditPassword] = useState('')

  const [moduleId, setModuleId] = useState('')
  const [classId, setClassId] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function resetCreate() {
    setFullName('')
    setEmail('')
    setEmployeeCode('')
    setPassword('')
    setError(null)
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api.post<TeacherRead>('/dos/teachers', {
        full_name: fullName.trim(),
        email: email.trim(),
        employee_code: employeeCode.trim(),
        password,
      })
      setCreateOpen(false)
      resetCreate()
      setNotice('Teacher account created. They can sign in now.')
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function onAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!assignTarget) return
    setError(null)
    setBusy(true)
    try {
      await api.post<TeacherModuleRead>(
        `/dos/teachers/${assignTarget.id}/modules`,
        {
          module_id: Number(moduleId),
          class_id: Number(classId),
        },
      )
      setAssignTarget(null)
      setModuleId('')
      setClassId('')
      setNotice('Module assignment saved.')
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  function openEdit(teacher: TeacherRead) {
    setEditTarget(teacher)
    setEditName(teacher.full_name)
    setEditEmail(teacher.email)
    setEditCode(teacher.employee_code)
    setEditPassword('')
    setError(null)
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editTarget) return
    setError(null)
    setBusy(true)
    try {
      const payload: Record<string, string> = {
        full_name: editName.trim(),
        email: editEmail.trim(),
        employee_code: editCode.trim(),
      }
      if (editPassword) payload.password = editPassword
      await api.patch<TeacherRead>(
        `/dos/teachers/${editTarget.id}`,
        payload,
      )
      setEditTarget(null)
      setNotice('Teacher updated.')
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(teacher: TeacherRead) {
    if (
      !window.confirm(
        `Delete ${teacher.full_name}? Their assignments and teacher links will be removed.`,
      )
    ) {
      return
    }
    setError(null)
    setNotice(null)
    try {
      await api.delete(`/dos/teachers/${teacher.id}`)
      setNotice('Teacher deleted.')
      data.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  if (data.loading) return <Spinner label="Loading teachers" />
  if (data.error) return <Alert>{data.error}</Alert>

  const teachers = data.data?.teachers ?? []

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Staff"
        title="Teachers"
        subtitle="Create teacher accounts and connect each teacher to the modules and classes they teach."
        action={<Button onClick={() => setCreateOpen(true)}>Add teacher</Button>}
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error && !createOpen && !assignTarget && !editTarget ? (
        <Alert>{error}</Alert>
      ) : null}

      <Card>
        {teachers.length === 0 ? (
          <EmptyState
            title="No teachers yet"
            description="Add the first teacher account. They will use the email and password you set to sign in."
            action={
              <Button onClick={() => setCreateOpen(true)}>Add teacher</Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Employee code</th>
                  <th>Email</th>
                  <th>Added</th>
                  <th className="align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>
                      <strong>{teacher.full_name}</strong>
                    </td>
                    <td>
                      <Badge tone="gold">{teacher.employee_code}</Badge>
                    </td>
                    <td>{teacher.email}</td>
                    <td className="muted">{formatDate(teacher.created_at)}</td>
                    <td className="align-right">
                      <div className="row-actions">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setAssignTarget(teacher)
                            setModuleId('')
                            setClassId('')
                            setError(null)
                          }}
                        >
                          Assign module
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEdit(teacher)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDelete(teacher)}
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
        open={createOpen}
        title="Add a teacher"
        subtitle="The teacher signs in with this email and password."
        onClose={() => {
          setCreateOpen(false)
          resetCreate()
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setCreateOpen(false)
                resetCreate()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="create-teacher-form" busy={busy}>
              Create account
            </Button>
          </>
        }
      >
        <form id="create-teacher-form" className="form-stack" onSubmit={onCreate}>
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Full name">
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Teacher's full name"
              required
            />
          </Field>
          <div className="form-grid">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teacher@school.test"
                required
              />
            </Field>
            <Field label="Employee code">
              <Input
                value={employeeCode}
                onChange={(event) => setEmployeeCode(event.target.value)}
                placeholder="e.g. NH-T-004"
                required
              />
            </Field>
          </div>
          <Field label="Temporary password" hint="At least 8 characters.">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Give this to the teacher"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={assignTarget !== null}
        title={assignTarget ? `Assign ${assignTarget.full_name}` : 'Assign module'}
        subtitle="Choose the module and class this teacher will handle."
        onClose={() => {
          setAssignTarget(null)
          setError(null)
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setAssignTarget(null)
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="assign-module-form"
              busy={busy}
              disabled={!moduleId || !classId}
            >
              Save assignment
            </Button>
          </>
        }
      >
        <form id="assign-module-form" className="form-stack" onSubmit={onAssign}>
          {error ? <Alert>{error}</Alert> : null}
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
        </form>
      </Modal>

      <Modal
        open={editTarget !== null}
        title="Edit teacher"
        subtitle="Leave the password field empty to keep the current password."
        onClose={() => {
          setEditTarget(null)
          setError(null)
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setEditTarget(null)
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-teacher-form"
              busy={busy}
              disabled={!editName.trim() || !editEmail.trim() || !editCode.trim()}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form id="edit-teacher-form" className="form-stack" onSubmit={onEdit}>
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Full name">
            <Input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              required
            />
          </Field>
          <div className="form-grid">
            <Field label="Email">
              <Input
                type="email"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
                required
              />
            </Field>
            <Field label="Employee code">
              <Input
                value={editCode}
                onChange={(event) => setEditCode(event.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="New password" hint="Optional. At least 8 characters.">
            <Input
              type="password"
              value={editPassword}
              onChange={(event) => setEditPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              placeholder="Leave empty to keep current"
            />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
