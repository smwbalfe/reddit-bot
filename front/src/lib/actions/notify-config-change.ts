'use server'

import { makeServerClient } from '@/src/lib/supabase/server'
import env from '../env'

interface ICPConfigChangeRequest {
  action: 'create' | 'update' | 'delete'
  icp_id?: number
  user_id: string
}

interface ICPConfigChangeResponse {
  success: boolean
  message: string
}

export async function notifyConfigChange(
  action: 'create' | 'update' | 'delete',
  icpId?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const requestData: ICPConfigChangeRequest = {
      action,
      user_id: user.id,
      ...(icpId && { icp_id: icpId })
    }

    const response = await fetch(`${env.FASTAPI_SERVER_URL}/api/icp-config-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ICPConfigChangeResponse = await response.json()
    
    if (!result.success) {
      throw new Error(result.message)
    }

    return { success: true }
  } catch (error) {
    console.error('Error notifying config change:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to notify config change' 
    }
  }
}