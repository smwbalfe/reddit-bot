'use server'

import { db } from '@/src/lib/db'
import { icps, usageTracking } from '@/src/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { checkSubscription } from '@/src/lib/actions/payment/check-subscription'
import { makeServerClient } from '@/src/lib/services/supabase/server'

interface GenerateReplyRequest {
  icpId: number
  redditPost: string
}

interface GenerateReplyResponse {
  reply: string
  success: boolean
  error?: string
  showUpgradeDialog?: boolean
  repliesUsed?: number
  monthlyLimit?: number
}

export async function generateReplyAction(
  request: GenerateReplyRequest
): Promise<GenerateReplyResponse> {
  try {
    const supabase = await makeServerClient()
    const {data: {user}} = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        reply: '',
        error: 'User not authenticated'
      }
    }

    const subscription = await checkSubscription()
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const usage = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, user.id),
          eq(usageTracking.month, currentMonth),
          eq(usageTracking.year, currentYear)
        )
      )
      .limit(1)

    const currentUsage = usage.length > 0 ? usage[0].repliesGenerated : 0

    if (!subscription.isSubscribed && currentUsage >= 10) {
      return {
        success: false,
        reply: '',
        error: 'Monthly limit reached. Upgrade to premium for unlimited replies.',
        showUpgradeDialog: true,
        repliesUsed: currentUsage,
        monthlyLimit: 10
      }
    }

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
    const productDescription = product.data?.description || `Product: ${product.name} (${product.website})`

    const fastApiUrl = process.env.FASTAPI_SERVER_URL
    
    const fetchBody = {
      reddit_post: request.redditPost,
      product_description: productDescription
    }
    const response = await fetch(`${fastApiUrl}/api/generate-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fetchBody),
    })

    if (!response.ok) {
      throw new Error(`FastAPI request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (usage.length > 0) {
      await db
        .update(usageTracking)
        .set({ 
          repliesGenerated: currentUsage + 1,
          updatedAt: new Date()
        })
        .where(eq(usageTracking.id, usage[0].id))
    } else {
      await db
        .insert(usageTracking)
        .values({
          userId: user.id,
          month: currentMonth,
          year: currentYear,
          repliesGenerated: 1
        })
    }

    return {
      success: true,
      reply: result.reply
    }
  } catch (error) {
    return {
      success: false,
      reply: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}