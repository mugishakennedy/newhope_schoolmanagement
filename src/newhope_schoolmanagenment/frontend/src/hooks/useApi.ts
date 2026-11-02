import { useEffect, useRef, useState } from 'react'

import { errorMessage } from '../api/client'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useApi<T>(
  load: () => Promise<T>,
  key: string | number = '',
): AsyncState<T> {
  const loadRef = useRef(load)
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    loadRef.current = load
  }, [load])

  useEffect(() => {
    let active = true

    async function run() {
      setLoading(true)
      setError(null)
      try {
        const result = await loadRef.current()
        if (active) setData(result)
      } catch (cause) {
        if (active) setError(errorMessage(cause))
      } finally {
        if (active) setLoading(false)
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [key, nonce])

  return {
    data,
    loading,
    error,
    reload: () => setNonce((value) => value + 1),
  }
}
