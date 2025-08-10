'use server'
import { db } from "@/src/lib/db"
import { icps } from "@/src/lib/db/schema"
import { eq } from "drizzle-orm"
import { makeServerClient } from '@/src/lib/services/supabase/server'

export async function getUserConfigs() {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const userConfigs = await db.select()
      .from(icps)
      .where(eq(icps.userId, user.id))
    
    return userConfigs
  } catch (error) {
    console.error('Error fetching user configs:', error)
    throw new Error('Failed to fetch user configs')
  }
}