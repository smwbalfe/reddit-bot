import { useState, useEffect, useRef } from 'react'
import { getNextScrapeTime } from '@/src/lib/actions/config/get-next-scrape-time'

interface NextScrapeData {
  next_run_time: string
  seconds_until_next_run: number
}

export function useNextScrapeTime() {
  const [data, setData] = useState<NextScrapeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchScrapeTime = async () => {
    try {
      setLoading(true)
      const result = await getNextScrapeTime()
      if (result.success && result.data) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch next scrape time')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch next scrape time')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScrapeTime()
    
    // Refresh every 30 seconds to keep countdown current
    intervalRef.current = setInterval(fetchScrapeTime, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const formatTimeUntilNext = (seconds: number): string => {
    if (seconds <= 0) return 'Running now'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  return {
    data,
    loading,
    error,
    formatTimeUntilNext
  }
}