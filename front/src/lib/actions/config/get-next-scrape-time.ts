'use server'

import env from '@/src/lib/env'

interface NextScrapeTimeResponse {
  next_run_time: string
  seconds_until_next_run: number
}

export async function getNextScrapeTime(): Promise<{ success: boolean; data?: NextScrapeTimeResponse; error?: string }> {
  try {
    const response = await fetch(`${env.FASTAPI_SERVER_URL}/scheduler/next-scrape-time`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.detail || 'Failed to get next scrape time'
      }
    }

    const data: NextScrapeTimeResponse = await response.json()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get next scrape time'
    }
  }
}