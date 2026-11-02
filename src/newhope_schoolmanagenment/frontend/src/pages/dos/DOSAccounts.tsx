import { useState } from 'react'
import type { FormEvent } from 'react'

import { api, errorMessage } from '../../api/client'
import type { DOSRead } from '../../api/types'
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
import { formatDate } from '../../utils/format'

export function DOSAccounts() {
  const accounts = useApi<DOSRead[]>(
    () => api.get('/dos/accounts'),
    'dos-accounts',
  )

  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function reset() {
    setFullName('')
    setEmail('')
    setPassword('')
    setError(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api.post<DOSRead>('/dos/accounts', {
        full_name: fullName.trim() || null,
        email: email.trim(),
        password,
      })
      setOpen(false)
      reset()
      setNotice('DOS account created.')
      accounts.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (accounts.loading) return <Spinner label="Loading accounts" />
  if (accounts.error) return <Alert>{accounts.error}</Alert>

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Administration"
        title="DOS accounts"
        subtitle="Add another Dean of Studies. These accounts have full access to the school management tools."
        action={<Button onClick={() => setOpen(true)}>Add DOS account</Button>}
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <Card>
        {(accounts.data ?? []).length === 0 ? (
          <EmptyState title="No accounts found" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {(accounts.data ?? []).map((account) => (
                  <tr key={account.id}>
                    <td>
                      <strong>{account.full_name}</strong>
                    </td>
                    <td>{account.email}</td>
                    <td className="muted">
                      {formatDate(account.created_at)}
                    </td>
                    <td>
                      <Badge tone="info">Dean of Studies</Badge>
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
        title="Add a DOS account"
        subtitle="This person will be able to manage the whole school."
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
            <Button type="submit" form="create-dos-form" busy={busy}>
              Create account
            </Button>
          </>
        }
      >
        <form id="create-dos-form" className="form-stack" onSubmit={onSubmit}>
          {error ? <Alert>{error}</Alert> : null}
          <Field
            label="Full name"
            hint="Optional. If left blank, the email name is used."
          >
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="dos@school.test"
              required
            />
          </Field>
          <Field
            label="Password"
            hint="At least 10 characters with upper and lower case, a number, and a special character."
          >
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Strong password"
              minLength={10}
              autoComplete="new-password"
              required
            />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
