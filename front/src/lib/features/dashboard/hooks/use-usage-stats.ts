"use client"

import { getUsageStats } from "@/src/lib/actions/usage/get-usage-stats"
import { useCallback, useEffect, useState } from "react"

interface UsageStats {
  monthly_qualified_leads: number
  monthly_lead_limit: number
  is_subscribed: boolean
}

export function useUsageStats() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsageStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await getUsageStats()
      
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setError(response.error || 'Failed to fetch usage stats')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsageStats()
  }, [fetchUsageStats])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchUsageStats
  }
}