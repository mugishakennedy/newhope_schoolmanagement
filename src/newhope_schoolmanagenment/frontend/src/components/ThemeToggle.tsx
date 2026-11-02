import type { ThemeMode } from '../utils/theme'

export function ThemeToggle({
  theme,
  onToggle,
  label,
}: {
  theme: ThemeMode
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
      <span>{label}</span>
    </button>
  )
}
