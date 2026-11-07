import { useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type { ClassRead } from '../../api/types'
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
  const classes = useApi<ClassRead[]>(
    () => api.get('/dos/classes'),
    'dos-classes',
  )

  const [className, setClassName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [editing, setEditing] = useState<ClassRead | null>(null)
  const [editName, setEditName] = useState('')
  const [editYear, setEditYear] = useState('')

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
      setSuccess('Class created.')
      classes.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  function openEdit(item: ClassRead) {
    setEditing(item)
    setEditName(item.class_name)
    setEditYear(item.academic_year)
    setError(null)
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setError(null)
    setBusy(true)
    try {
      await api.patch<ClassRead>(`/dos/classes/${editing.id}`, {
        class_name: editName.trim(),
        academic_year: editYear.trim(),
      })
      setEditing(null)
      setSuccess('Class updated.')
      classes.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(item: ClassRead) {
    if (
      !window.confirm(
        `Delete ${item.class_name} (${item.academic_year})? Its assignments and teacher links will be removed.`,
      )
    ) {
      return
    }
    setError(null)
    setSuccess(null)
    try {
      await api.delete(`/dos/classes/${item.id}`)
      setSuccess('Class deleted.')
      classes.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Setup"
        title="Classes"
        subtitle="A class belongs to one academic year. The same name can repeat in a new year."
      />

      <div className="content-grid">
        <Card title="Create a class">
          {error && !editing ? <Alert>{error}</Alert> : null}
          {success ? <Alert tone="success">{success}</Alert> : null}
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
                    <th>ID</th>
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
                      <td className="muted">{item.id}</td>
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
                            onClick={() => onDelete(item)}
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
        title="Edit class"
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
              form="edit-class-form"
              busy={busy}
              disabled={!editName.trim() || !editYear.trim()}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form id="edit-class-form" className="form-stack" onSubmit={onEdit}>
          {error ? <Alert>{error}</Alert> : null}
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
    </div>
  )
}
