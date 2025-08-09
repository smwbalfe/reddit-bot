'use server'

import { db } from '@/src/lib/db'
import { icps } from '@/src/lib/db/schema'
import { eq } from 'drizzle-orm'

interface GenerateReplyRequest {
  icpId: number
  redditPost: string
}

interface GenerateReplyResponse {
  reply: string
  success: boolean
  error?: string
}

export async function generateReplyAction(
  request: GenerateReplyRequest
): Promise<GenerateReplyResponse> {
  try {
    // Fetch ICP (product) from database
    const icp = await db
      .select()
      .from(icps)
      .where(eq(icps.id, request.icpId))
      .limit(1)

    if (!icp.length) {
      return {
        success: false,
        reply: '',
        error: 'Product not found'
      }
    }

    const product = icp[0]
    
    // Extract product description from the ICP data
    const productDescription = product.data?.description || `Product: ${product.name} (${product.website})`

    // Call FastAPI endpoint
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000'
    const response = await fetch(`${fastApiUrl}/api/generate-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reddit_post: request.redditPost,
        product_description: productDescription
      }),
    })

    if (!response.ok) {
      throw new Error(`FastAPI request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    return {
      success: true,
      reply: result.reply
    }
  } catch (error) {
    console.error('Error generating reply:', error)
    return {
      success: false,
      reply: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}