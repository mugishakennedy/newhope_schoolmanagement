import { useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type { ModuleRead } from '../../api/types'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Spinner,
  Textarea,
} from '../../components/ui'
import { useApi } from '../../hooks/useApi'

export function DOSModules() {
  const modules = useApi<ModuleRead[]>(
    () => api.get('/dos/modules'),
    'dos-modules',
  )

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      await api.post<ModuleRead>('/dos/modules', {
        module_code: code.trim(),
        module_name: name.trim(),
        description: description.trim() || null,
      })
      setCode('')
      setName('')
      setDescription('')
      setSuccess('Module created.')
      modules.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Setup"
        title="Modules"
        subtitle="Modules are the subjects teachers deliver and students receive work for."
      />

      <div className="content-grid">
        <Card title="Create a module">
          {error ? <Alert>{error}</Alert> : null}
          {success ? <Alert tone="success">{success}</Alert> : null}
          <form className="form-stack" onSubmit={onSubmit}>
            <Field label="Module code">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="e.g. MATH101"
                required
              />
            </Field>
            <Field label="Module name">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Mathematics"
                required
              />
            </Field>
            <Field label="Description" hint="Optional.">
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="What does this module cover?"
              />
            </Field>
            <Button type="submit" busy={busy}>
              Add module
            </Button>
          </form>
        </Card>

        <Card
          title="All modules"
          subtitle={`${modules.data?.length ?? 0} on record`}
        >
          {modules.loading ? (
            <Spinner label="Loading modules" />
          ) : modules.error ? (
            <Alert>{modules.error}</Alert>
          ) : (modules.data ?? []).length === 0 ? (
            <EmptyState
              title="No modules yet"
              description="Add a module before assigning teachers to classes."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Code</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(modules.data ?? []).map((module) => (
                    <tr key={module.id}>
                      <td>
                        <strong>{module.module_name}</strong>
                      </td>
                      <td>
                        <Badge tone="gold">{module.module_code}</Badge>
                      </td>
                      <td className="muted">
                        {module.description || 'No description'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
