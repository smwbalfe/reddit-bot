'use server'
import { db } from "@/src/lib/db"
import { icps } from "@/src/lib/db/schema"
import { eq } from "drizzle-orm"
import { checkSubscription } from '@/src/lib/actions/payment/check-subscription'
import { makeServerClient } from '@/src/lib/services/supabase/server'

export async function updateIcpLimits() {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const subscription = await checkSubscription()
    const leadLimit = subscription.isSubscribed ? 500 : 100

    await db.update(icps)
      .set({ leadLimit })
      .where(eq(icps.userId, user.id))

    return { success: true }
  } catch (error) {
    console.error('Error updating ICP limits:', error)
    return { success: false, error: 'Failed to update ICP limits' }
  }
}