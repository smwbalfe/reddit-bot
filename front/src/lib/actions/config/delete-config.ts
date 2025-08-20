'use server'
import { db } from "@/src/lib/db"
import { icps, redditPosts, processedPosts } from "@/src/lib/db/schema"
import { eq } from "drizzle-orm"
import { makeServerClient } from '@/src/lib/services/supabase/server'
import { notifyConfigChange } from '@/src/lib/actions/notifications/notify-config-change'

export async function deleteConfig(id: number) {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    await db.delete(redditPosts).where(eq(redditPosts.icpId, id))
    await db.delete(processedPosts).where(eq(processedPosts.icpId, id))
    await db.delete(icps).where(eq(icps.id, id))
    
    const notifyResult = await notifyConfigChange('delete', id)
    if (!notifyResult.success) {
      console.warn('Failed to notify backend about config deletion:', notifyResult.error)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting config:', error)
    return { success: false, error: 'Failed to delete config' }
  }
}