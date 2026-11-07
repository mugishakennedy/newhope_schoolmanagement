import { useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type { ClassRead, ClassStats } from '../../api/types'
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
  Spinner,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'

export function DOSClasses() {
  const classes = useApi<ClassStats[]>(
    () => api.get('/dos/classes/overview'),
    'dos-classes-overview',
  )

  const [className, setClassName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [editing, setEditing] = useState<ClassStats | null>(null)
  const [editName, setEditName] = useState('')
  const [editYear, setEditYear] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editBusy, setEditBusy] = useState(false)

  const [deleting, setDeleting] = useState<ClassStats | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      await api.post<ClassRead>('/dos/classes', {
        class_name: className.trim(),
        academic_year: academicYear.trim(),
      })
      setClassName('')
      setAcademicYear('')
      setSuccess('Class created. It is now available to students and teachers.')
      classes.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  function openEdit(item: ClassStats) {
    setEditing(item)
    setEditName(item.class_name)
    setEditYear(item.academic_year)
    setEditError(null)
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setEditError(null)
    setEditBusy(true)
    try {
      await api.patch<ClassRead>(`/dos/classes/${editing.id}`, {
        class_name: editName.trim(),
        academic_year: editYear.trim(),
      })
      setEditing(null)
      setSuccess('Class updated.')
      classes.reload()
    } catch (cause) {
      setEditError(errorMessage(cause))
    } finally {
      setEditBusy(false)
    }
  }

  async function onDelete() {
    if (!deleting) return
    setDeleteError(null)
    setDeleteBusy(true)
    try {
      await api.delete(`/dos/classes/${deleting.id}`)
      setDeleting(null)
      setSuccess('Class deleted.')
      classes.reload()
    } catch (cause) {
      setDeleteError(errorMessage(cause))
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Setup"
        title="Classes"
        subtitle="Only the DOS creates classes. Each class is tied to students, teacher modules, and assignments."
      />

      {success ? <Alert tone="success">{success}</Alert> : null}

      <div className="content-grid">
        <Card title="Create a class">
          {error ? <Alert>{error}</Alert> : null}
          <form className="form-stack" onSubmit={onSubmit}>
            <Field label="Class name">
              <Input
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                placeholder="e.g. Senior 1"
                required
              />
            </Field>
            <Field label="Academic year">
              <Input
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
                placeholder="e.g. 2026-2027"
                required
              />
            </Field>
            <Button type="submit" busy={busy}>
              Add class
            </Button>
          </form>
        </Card>

        <Card
          title="All classes"
          subtitle={`${classes.data?.length ?? 0} set up`}
        >
          {classes.loading ? (
            <Spinner label="Loading classes" />
          ) : classes.error ? (
            <Alert>{classes.error}</Alert>
          ) : (classes.data ?? []).length === 0 ? (
            <EmptyState
              title="No classes yet"
              description="Create the first class to start placing students and teachers."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Academic year</th>
                    <th>Students</th>
                    <th>Teachers</th>
                    <th>Modules</th>
                    <th>Assignments</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(classes.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.class_name}</strong>
                      </td>
                      <td>
                        <Badge tone="info">{item.academic_year}</Badge>
                      </td>
                      <td>{item.students}</td>
                      <td>{item.teachers}</td>
                      <td>{item.modules}</td>
                      <td>{item.assignments}</td>
                      <td className="align-right">
                        <div className="row-actions">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEdit(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setDeleting(item)
                              setDeleteError(null)
                            }}
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
      </div>

      <Modal
        open={editing !== null}
        title={editing ? `Edit ${editing.class_name}` : 'Edit class'}
        subtitle="Renaming a class keeps its students, teachers, and assignments connected."
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-class-form"
              busy={editBusy}
              disabled={!editName.trim() || !editYear.trim()}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form id="edit-class-form" className="form-stack" onSubmit={onEdit}>
          {editError ? <Alert>{editError}</Alert> : null}
          <Field label="Class name">
            <Input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              required
            />
          </Field>
          <Field label="Academic year">
            <Input
              value={editYear}
              onChange={(event) => setEditYear(event.target.value)}
              required
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        title={deleting ? `Delete ${deleting.class_name}?` : 'Delete class'}
        subtitle="This cannot be undone."
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" busy={deleteBusy} onClick={onDelete}>
              Delete class
            </Button>
          </>
        }
      >
        {deleteError ? <Alert>{deleteError}</Alert> : null}
        <p>
          Students in this class become unassigned. Teacher module links and
          assignments for this class are removed.
        </p>
      </Modal>
    </div>
  )
}
