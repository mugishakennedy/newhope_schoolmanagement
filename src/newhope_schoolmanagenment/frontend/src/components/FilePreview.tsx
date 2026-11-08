import { useEffect, useState } from 'react'

import { mediaUrl } from '../api/client'
import { Button, Modal } from './ui'

type PreviewKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'unsupported'

const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'bmp',
  'avif',
])
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mkv', 'avi', 'ogv'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'])
const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'csv',
  'tsv',
  'json',
  'xml',
  'yml',
  'yaml',
  'py',
  'js',
  'ts',
  'tsx',
  'jsx',
  'java',
  'c',
  'cpp',
  'h',
  'css',
  'html',
  'sql',
  'log',
  'ini',
  'sh',
])

function extensionOf(value: string): string {
  const clean = value.split(/[?#]/)[0]
  const slash = clean.lastIndexOf('/')
  const dot = clean.lastIndexOf('.')
  if (dot <= slash) return ''
  return clean.slice(dot + 1).toLowerCase()
}

function previewKind(
  url: string,
  name?: string | null,
  contentType?: string | null,
): PreviewKind {
  const mime = (contentType ?? '').trim().toLowerCase()
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('text/')) return 'text'

  const ext = extensionOf(name ?? url)
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (VIDEO_EXTENSIONS.has(ext)) return 'video'
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio'
  if (TEXT_EXTENSIONS.has(ext)) return 'text'
  return 'unsupported'
}

function TextPreview({ src }: { src: string }) {
  const [state, setState] = useState<{
    status: 'loading' | 'ready' | 'error'
    text: string
    src: string
  }>({ status: 'loading', text: '', src: '' })

  useEffect(() => {
    let active = true
    fetch(src)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Unable to load file (${response.status})`)
        }
        return response.text()
      })
      .then((text) => {
        if (active) {
          setState({
            status: 'ready',
            text: text.slice(0, 200_000),
            src,
          })
        }
      })
      .catch(() => {
        if (active) setState({ status: 'error', text: '', src })
      })
    return () => {
      active = false
    }
  }, [src])

  if (state.src !== src || state.status === 'loading') {
    return <p className="muted">Loading preview...</p>
  }
  if (state.status === 'error') {
    return (
      <p className="muted">
        This text file could not be previewed. Use Download to open it.
      </p>
    )
  }
  return <pre className="file-preview-text">{state.text}</pre>
}

function PreviewBody({
  kind,
  src,
  name,
}: {
  kind: PreviewKind
  src: string
  name: string
}) {
  switch (kind) {
    case 'image':
      return <img className="file-preview-image" src={src} alt={name} />
    case 'pdf':
      return (
        <iframe
          className="file-preview-frame"
          src={src}
          title={name}
        />
      )
    case 'video':
      return <video className="file-preview-frame" src={src} controls />
    case 'audio':
      return <audio className="file-preview-audio" src={src} controls />
    case 'text':
      return <TextPreview src={src} />
    default:
      return (
        <div className="file-preview-fallback">
          <p className="muted">
            This file cannot be previewed in the browser. Download it or open it
            in a new tab.
          </p>
          <a
            className="text-link"
            href={src}
            target="_blank"
            rel="noreferrer"
          >
            Open in a new tab
          </a>
        </div>
      )
  }
}

interface FilePreviewProps {
  url: string
  name?: string | null
  contentType?: string | null
  meta?: string | null
  compact?: boolean
}

export function FilePreview({
  url,
  name,
  contentType,
  meta,
  compact = false,
}: FilePreviewProps) {
  const [open, setOpen] = useState(false)
  const resolved = mediaUrl(url)
  const displayName =
    name?.trim() || url.split('/').pop()?.split('?')[0] || 'Attachment'
  const kind = previewKind(url, name, contentType)

  const actions = (
    <div className="attachment-actions">
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Open
      </Button>
      <a
        className="btn btn-ghost btn-sm"
        href={resolved}
        download={displayName}
        target="_blank"
        rel="noreferrer"
      >
        Download
      </a>
    </div>
  )

  const modal = (
    <Modal
      open={open}
      title={displayName}
      subtitle={contentType ?? undefined}
      onClose={() => setOpen(false)}
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
          <a
            className="btn btn-primary btn-md"
            href={resolved}
            download={displayName}
            target="_blank"
            rel="noreferrer"
          >
            Download
          </a>
        </>
      }
    >
      <PreviewBody kind={kind} src={resolved} name={displayName} />
    </Modal>
  )

  if (compact) {
    return (
      <>
        {actions}
        {modal}
      </>
    )
  }

  return (
    <div className="attachment-item">
      <div className="attachment-meta">
        <strong>{displayName}</strong>
        {meta ? <small>{meta}</small> : null}
      </div>
      {actions}
      {modal}
    </div>
  )
}
