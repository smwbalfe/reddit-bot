'use server'
import { db } from "@/src/lib/db"
import { icps, redditPosts } from "@/src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { makeServerClient } from '@/src/lib/services/supabase/server'

export async function updateLeadStatus(postId: number, status: 'new' | 'seen' | 'responded') {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // First verify the post belongs to the user
    const post = await db.select({
      id: redditPosts.id,
      userId: icps.userId,
    })
      .from(redditPosts)
      .innerJoin(icps, eq(redditPosts.icpId, icps.id))
      .where(eq(redditPosts.id, postId))
      .limit(1)

    if (!post.length || post[0].userId !== user.id) {
      throw new Error('Post not found or unauthorized')
    }

    // Update the lead status
    await db.update(redditPosts)
      .set({ 
        leadStatus: status,
        updatedAt: new Date()
      })
      .where(eq(redditPosts.id, postId))

    return { success: true }
  } catch (error) {
    console.error('Error updating lead status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update lead status'
    }
  }
}