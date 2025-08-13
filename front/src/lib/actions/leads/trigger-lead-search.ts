"use server"

import env from "../../env"



interface TriggerLeadSearchParams {
  userId?: string
  limit?: number
}

interface TriggerLeadSearchResult {
  success: boolean
  message: string
  leads_found: number
}

export async function triggerLeadSearch(
  params: TriggerLeadSearchParams = {}
): Promise<TriggerLeadSearchResult> {
  try {
    const response = await fetch(`${env.FASTAPI_SERVER_URL}/api/trigger-lead-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: params.userId,
        limit: params.limit || 50,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to trigger lead search: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error triggering lead search:", error)
    return {
      success: false,
      message: "Failed to trigger lead search. Please try again.",
      leads_found: 0,
    }
  }
}