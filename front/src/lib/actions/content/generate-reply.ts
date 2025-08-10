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
    console.log('generateReplyAction called with request:', request)

    const supabase = await makeServerClient()
    const {data: {user}} = await supabase.auth.getUser()
    console.log('Supabase user:', user)
    
    if (!user) {
      console.log('User not authenticated')
      return {
        success: false,
        reply: '',
        error: 'User not authenticated'
      }
    }

    const subscription = await checkSubscription()
    console.log('Subscription:', subscription)
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    console.log('Current month/year:', currentMonth, currentYear)

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
    console.log('Usage for user:', usage)

    const currentUsage = usage.length > 0 ? usage[0].repliesGenerated : 0
    console.log('Current usage:', currentUsage)

    if (!subscription.isSubscribed && currentUsage >= 10) {
      console.log('Monthly limit reached for user:', user.id)
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
    console.log('ICP lookup result:', icp)

    if (!icp.length) {
      console.log('Product not found for icpId:', request.icpId)
      return {
        success: false,
        reply: '',
        error: 'Product not found'
      }
    }

    const product = icp[0]
    console.log('Product:', product)
    
    const productDescription = product.data?.description || `Product: ${product.name} (${product.website})`
    console.log('Product description:', productDescription)

    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000'
    console.log('FastAPI URL:', fastApiUrl)
    const fetchBody = {
      reddit_post: request.redditPost,
      product_description: productDescription
    }
    console.log('Sending fetch to FastAPI with body:', fetchBody)
    const response = await fetch(`${fastApiUrl}/api/generate-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fetchBody),
    })
    console.log('FastAPI response status:', response.status, response.statusText)

    if (!response.ok) {
      console.log('FastAPI request failed:', response.status, response.statusText)
      throw new Error(`FastAPI request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('FastAPI result:', result)

    if (usage.length > 0) {
      console.log('Updating usageTracking for user:', user.id)
      await db
        .update(usageTracking)
        .set({ 
          repliesGenerated: currentUsage + 1,
          updatedAt: new Date()
        })
        .where(eq(usageTracking.id, usage[0].id))
    } else {
      console.log('Inserting new usageTracking for user:', user.id)
      await db
        .insert(usageTracking)
        .values({
          userId: user.id,
          month: currentMonth,
          year: currentYear,
          repliesGenerated: 1
        })
    }

    console.log('Returning success with reply:', result.reply)
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