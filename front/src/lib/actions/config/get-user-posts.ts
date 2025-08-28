'use server'
import { db } from "@/src/lib/db"
import { icps, redditPosts } from "@/src/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { makeServerClient } from '@/src/lib/services/supabase/server'
import { checkSubscription } from '@/src/lib/actions/payment/check-subscription'
import env from '@/src/lib/env'

export async function getUserPosts() {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const subscription = await checkSubscription()
    
    const leadLimit = subscription.isSubscribed ? undefined : env.NEXT_PUBLIC_FREE_LEAD_LIMIT

    const baseQuery = db.select({
      id: redditPosts.id,
      configId: redditPosts.icpId,
      subreddit: redditPosts.subreddit,
      title: redditPosts.title,
      content: redditPosts.content,
      url: redditPosts.url,
      leadQuality: redditPosts.leadQuality,
      leadStatus: redditPosts.leadStatus,
      analysisData: redditPosts.analysisData,
      redditCreatedAt: redditPosts.redditCreatedAt,
      createdAt: redditPosts.createdAt,
      updatedAt: redditPosts.updatedAt,
    })
      .from(redditPosts)
      .innerJoin(icps, eq(redditPosts.icpId, icps.id))
      .where(eq(icps.userId, user.id))
      .orderBy(desc(redditPosts.createdAt))

    // Apply limit only for free users (premium users have no limit)
    const userPosts = await (leadLimit ? baseQuery.limit(leadLimit) : baseQuery)
    
    return userPosts as any[]
  } catch (error) {
    console.error('Error fetching user posts:', error)
    throw new Error('Failed to fetch user posts')
  }
}