import { useState, useEffect, useCallback } from 'react'
import { getDashboard } from '../utils/api'

export function useDashboard(userId = 1) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getDashboard(userId)
      setData(res.data.data)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])
  return { data, loading, error, reload: load }
}
