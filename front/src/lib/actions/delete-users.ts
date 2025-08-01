'use server'
import { createAdminClient } from '@/src/lib/supabase/server'
import { db } from '@/src/lib/db'
import { accounts } from '@/src/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function deleteCurrentUser(userId: string) {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
        return { success: false, error: error.message }
    }
    try {
        await db.delete(accounts).where(eq(accounts.userId, userId))
    } catch (e: any) {
        return { success: false, error: e.message }
    }
    return { success: true, data }
}