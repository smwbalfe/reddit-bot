'use server'
import { db } from "@/src/lib/db"
import { icps, redditPosts } from "@/src/lib/db/schema"
import { eq, count } from "drizzle-orm"
import { makeServerClient } from '@/src/lib/services/supabase/server'

export async function getUserLeadCount() {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const result = await db.select({ count: count() })
      .from(redditPosts)
      .innerJoin(icps, eq(redditPosts.icpId, icps.id))
      .where(eq(icps.userId, user.id))
    
    return result[0]?.count || 0
  } catch (error) {
    console.error('Error fetching user lead count:', error)
    throw new Error('Failed to fetch user lead count')
  }
}