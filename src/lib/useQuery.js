import { useCallback, useEffect, useRef, useState } from 'react'

// Minimal async data hook: runs `fn` when deps change and exposes reload().
export function useQuery(fn, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const result = await fnRef.current()
      setData(result)
      setError(null)
    } catch (e) {
      console.error(e)
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, error, loading, reload: () => run(true), setData }
}

// Throws Supabase errors so useQuery can catch them.
export function unwrap({ data, error }) {
  if (error) throw error
  return data
}
