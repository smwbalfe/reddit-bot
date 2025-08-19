'use server'

import env from '@/src/lib/env'

export async function forceScrape() {
  try {
    const response = await fetch(`${env.FASTAPI_SERVER_URL}/scheduler/trigger-scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error triggering force scrape:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger scrape' 
    }
  }
}