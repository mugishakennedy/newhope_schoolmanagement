import type {
  AssignmentAttachment,
  AssignmentKind,
} from '../api/types'
import { formatDate } from '../utils/format'
import { FilePreview } from './FilePreview'
import { Badge } from './ui'

interface AssignmentPreviewProps {
  title: string
  description?: string | null
  kind?: AssignmentKind
  deadline?: string | null
  moduleLabel?: string
  courseLabel?: string
  attachments?: AssignmentAttachment[]
  staged?: File[]
}

export function AssignmentPreview({
  title,
  description,
  kind,
  deadline,
  moduleLabel,
  courseLabel,
  attachments = [],
  staged = [],
}: AssignmentPreviewProps) {
  const meta = [moduleLabel, courseLabel].filter(Boolean).join(' · ')

  return (
    <div className="form-stack">
      <div className="read-panel">
        <span className="eyebrow">Student preview</span>
        <div className="preview-title">
          <strong>{title.trim() || 'Untitled assignment'}</strong>
          {kind === 'quiz' ? <Badge tone="info">Quiz</Badge> : null}
        </div>
        <small className="muted">
          {[meta, `due ${formatDate(deadline)}`].filter(Boolean).join(' · ')}
        </small>
      </div>
      <div className="read-panel">
        <span className="eyebrow">Assessment</span>
        <p className="submission-answer">
          {description?.trim() ||
            'No assessment or instructions have been written yet.'}
        </p>
      </div>
      <div className="read-panel">
        <span className="eyebrow">Your answer</span>
        <p className="muted">
          Students will type their answer here and submit it. Submitted work is
          final and cannot be changed while they wait for a grade.
        </p>
      </div>
      <div className="read-panel">
        <span className="eyebrow">Resources</span>
        {attachments.length === 0 && staged.length === 0 ? (
          <p className="muted">No resources attached yet.</p>
        ) : null}
        {attachments.length > 0 ? (
          <div className="attachment-list">
            {attachments.map((attachment) => (
              <FilePreview
                key={attachment.id}
                url={attachment.content_url}
                name={attachment.original_name}
                contentType={attachment.content_type}
              />
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
                  <small>Uploads when you save</small>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
