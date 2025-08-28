'use server'

import env from "@/src/lib/env"

export interface ValidateSubredditResponse {
  is_valid: boolean
  error_message?: string
}

export async function validateSubreddit(subredditName: string): Promise<ValidateSubredditResponse> {
  try {
    const response = await fetch(`${env.FASTAPI_SERVER_URL}/api/validate-subreddit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subreddit_name: subredditName
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    return {
      is_valid: false,
      error_message: 'Failed to validate subreddit. Please try again.'
    }
  }
}