'use server'

import { db } from "@/src/lib/db"
import { systemFlags } from "@/src/lib/db/schema"
import { eq } from "drizzle-orm"
import { makeServerClient } from '@/src/lib/services/supabase/server'

export async function setSystemFlag(key: string, value: boolean, description?: string) {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    await db.insert(systemFlags)
      .values({
        key,
        value,
        description,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemFlags.key,
        set: {
          value,
          updatedAt: new Date(),
          ...(description && { description }),
        }
      })

    return { success: true }
  } catch (error) {
    console.error(`Error setting system flag ${key}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : `Failed to set system flag ${key}` 
    }
  }
}

export async function skipPollPeriod() {
  return setSystemFlag('skip_poll_period', true, 'Skip current poll period and move to next cycle immediately')
}

export async function triggerScraperRefresh() {
  return setSystemFlag('scraper_refresh_needed', true, 'Trigger scraper to refresh ICP configurations')
}

export async function resetPollPeriod() {
  return setSystemFlag('skip_poll_period', true, 'Reset current poll period and start next collection cycle immediately')
}

export async function getSystemFlag(key: string): Promise<boolean> {
  try {
    const result = await db.select({ value: systemFlags.value })
      .from(systemFlags)
      .where(eq(systemFlags.key, key))
      .limit(1)

    return result.length > 0 ? result[0].value : false
  } catch (error) {
    console.error(`Error getting system flag ${key}:`, error)
    return false
  }
}

export async function getScraperStatus(): Promise<{ isPaused: boolean }> {
  const isPaused = await getSystemFlag('scraper_paused')
  return { isPaused }
}
