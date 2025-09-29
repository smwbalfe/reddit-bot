'use server'

import env from '@/src/lib/env-backend'

export async function testRedditApi() {
  try {
    const response = await fetch(`${env.FASTAPI_SERVER_URL}/api/test-reddit`, {
      method: 'GET',
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
    console.error('Error testing Reddit API:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test Reddit API' 
    }
  }
}
