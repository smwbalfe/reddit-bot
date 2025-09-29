'use server'

import env from '@/src/lib/env-backend'

export async function triggerInitialSeeding(icpId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${env.FASTAPI_SERVER_URL}/scheduler/trigger-initial-seeding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ icp_id: icpId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.detail || 'Failed to trigger initial seeding'
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger initial seeding'
    }
  }
}