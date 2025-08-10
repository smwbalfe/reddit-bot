'use server'
import { db } from "@/src/lib/db"
import { icps } from "@/src/lib/db/schema"
import { eq } from "drizzle-orm"
import { makeServerClient } from '@/src/lib/services/supabase/server'
import { notifyConfigChange } from '@/src/lib/actions/notifications/notify-config-change'

export async function disableMonitoring() {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const updatedIcps = await db.update(icps)
      .set({
        monitoringEnabled: false,
        updatedAt: new Date(),
      })
      .where(eq(icps.userId, user.id))
      .returning()
    
    for (const icp of updatedIcps) {
      const notifyResult = await notifyConfigChange('update', icp.id)
      if (!notifyResult.success) {
        console.warn(`Failed to notify backend about monitoring disabled for ICP ${icp.id}:`, notifyResult.error)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error disabling monitoring:', error)
    return { success: false, error: 'Failed to disable monitoring' }
  }
}