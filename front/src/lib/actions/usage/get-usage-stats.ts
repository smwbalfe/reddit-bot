'use server'

import { makeServerClient } from '@/src/lib/services/supabase/server'

interface UsageStats {
  monthly_qualified_leads: number
  monthly_lead_limit: number
  is_subscribed: boolean
}

export async function getUsageStats(): Promise<{
  success: boolean
  data?: UsageStats
  error?: string
}> {
  try {
    const supabase = await makeServerClient()
    const {data: {user}} = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000'
    const response = await fetch(`${fastApiUrl}/api/usage-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id
      }),
    })

    if (!response.ok) {
      throw new Error(`FastAPI request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Error getting usage stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}