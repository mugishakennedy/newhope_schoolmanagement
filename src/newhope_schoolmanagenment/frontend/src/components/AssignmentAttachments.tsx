import { useCallback, useEffect, useState } from 'react'

import { api, errorMessage, mediaUrl } from '../api/client'
import type { AssignmentAttachment } from '../api/types'
import { formatDateTime } from '../utils/format'
import { Button, Field } from './ui'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface AssignmentAttachmentsProps {
  basePath: string
  assignmentId: number | null
  staged: File[]
  onStagedChange: (files: File[]) => void
  onError: (message: string) => void
}

export function AssignmentAttachments({
  basePath,
  assignmentId,
  staged,
  onStagedChange,
  onError,
}: AssignmentAttachmentsProps) {
  const [existing, setExisting] = useState<AssignmentAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (assignmentId === null) {
      setExisting([])
      return
    }
    setLoading(true)
    try {
      const list = await api.get<AssignmentAttachment[]>(
        `${basePath}/${assignmentId}/attachments`,
      )
      setExisting(list)
    } catch (cause) {
      onError(errorMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [assignmentId, basePath, onError])

  useEffect(() => {
    let active = true

    async function run() {
      if (assignmentId === null) {
        if (active) setExisting([])
        return
      }
      setLoading(true)
      try {
        const list = await api.get<AssignmentAttachment[]>(
          `${basePath}/${assignmentId}/attachments`,
        )
        if (active) setExisting(list)
      } catch (cause) {
        if (active) onError(errorMessage(cause))
      } finally {
        if (active) setLoading(false)
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [assignmentId, basePath, onError])

  function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    if (picked.length > 0) {
      onStagedChange([...staged, ...picked])
    }
    event.target.value = ''
  }

  function removeStaged(index: number) {
    onStagedChange(staged.filter((_, position) => position !== index))
  }

  async function removeExisting(attachment: AssignmentAttachment) {
    if (!window.confirm(`Remove "${attachment.original_name}"?`)) return
    setBusyId(attachment.id)
    try {
      await api.delete(
        `${basePath}/${attachment.assignment_id}/attachments/${attachment.id}`,
      )
      await load()
    } catch (cause) {
      onError(errorMessage(cause))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="form-stack">
      <Field
        label="Resources"
        hint="Attach worksheets, slides, or readings. Maximum size is 25 MB per file."
      >
        <input
          className="file-input"
          type="file"
          multiple
          onChange={addFiles}
        />
      </Field>

      {assignmentId !== null && loading ? (
        <small className="muted">Loading resources...</small>
      ) : null}

      {existing.length > 0 ? (
        <div className="attachment-list">
          {existing.map((attachment) => (
            <div className="attachment-item" key={attachment.id}>
              <div className="attachment-meta">
                <a
                  href={mediaUrl(attachment.content_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {attachment.original_name}
                </a>
                <small>
                  {formatSize(attachment.size_bytes)} ·{' '}
                  {formatDateTime(attachment.created_at)}
                </small>
              </div>
              <div className="attachment-actions">
                <Button
                  size="sm"
                  variant="danger"
                  busy={busyId === attachment.id}
                  onClick={() => removeExisting(attachment)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {staged.length > 0 ? (
        <div className="attachment-list">
          {staged.map((file, index) => (
            <div
              className="attachment-item"
              key={`${file.name}-${file.size}-${index}`}
            >
              <div className="attachment-meta">
                <strong>{file.name}</strong>
                <small>
                  {formatSize(file.size)} · uploads when you save
                </small>
              </div>
              <div className="attachment-actions">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeStaged(index)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
