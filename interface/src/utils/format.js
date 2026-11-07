export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatDate(value, options = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function timeAgo(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diff = Date.now() - date.getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

export function daysUntil(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const diff = date.getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export function deadlineLabel(value) {
  if (!value) return 'No deadline'
  const days = daysUntil(value)
  if (days === null) return 'No deadline'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days > 1) return `Due in ${days} days`
  if (days === -1) return 'Overdue by 1 day'
  return `Overdue by ${Math.abs(days)} days`
}

export function isOverdue(value) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() < Date.now()
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function formatGrade(value) {
  if (value === null || value === undefined || value === '') return '—'
  const grade = Number(value)
  if (!Number.isFinite(grade)) return '—'
  return `${grade.toFixed(grade % 1 === 0 ? 0 : 1)}%`
}

export function gradeTone(grade) {
  if (grade === null || grade === undefined || grade === '') return 'muted'
  const value = Number(grade)
  if (!Number.isFinite(value)) return 'muted'
  if (value >= 75) return 'success'
  if (value >= 50) return 'warning'
  return 'danger'
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function sortByName(items = [], key = 'full_name') {
  return [...items].sort((a, b) =>
    String(a[key] || '').localeCompare(String(b[key] || '')),
  )
}
