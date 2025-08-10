'use server'

import { db } from '@/src/lib/db'
import { usageTracking } from '@/src/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { makeServerClient } from '@/src/lib/services/supabase/server'

interface UserUsageData {
  repliesGenerated: number
}

export async function getUserUsage(): Promise<UserUsageData> {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

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

    return {
      repliesGenerated: usage.length > 0 ? usage[0].repliesGenerated : 0
    }
  } catch (error) {
    console.error('Error fetching user usage:', error)
    throw new Error('Failed to fetch user usage')
  }
}