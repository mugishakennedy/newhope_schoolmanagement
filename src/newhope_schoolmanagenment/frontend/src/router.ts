import { useCallback, useEffect, useState } from 'react'

function normalize(hash: string): string {
  const path = hash.replace(/^#/, '')
  if (!path) return '/'
  return path.startsWith('/') ? path : `/${path}`
}

export function useHashRoute(): [string, (path: string) => void] {
  const [path, setPath] = useState(() => normalize(window.location.hash))

  useEffect(() => {
    const onChange = () => setPath(normalize(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: string) => {
    const target = normalize(next)
    if (normalize(window.location.hash) === target) {
      setPath(target)
      return
    }
    window.location.hash = target
  }, [])

  return [path, navigate]
}
