'use server'
import { db } from "@/src/lib/db"
import { accounts } from "@/src/lib/db/schema"
import { sendWelcomeEmail } from "@/src/lib/actions/send-welcome-email"
import { createAdminClient } from "@/src/lib/supabase/server"
import { eq } from "drizzle-orm"

export async function createOrUpdateUserAccount(userId: string) {
    console.log(`[createOrUpdateUserAccount] Starting process for userId: ${userId}`)
    
    try {
        console.log(`[createOrUpdateUserAccount] Attempting to insert/update account for userId: ${userId}`)
        await db.insert(accounts)
            .values({ userId })
            .onConflictDoUpdate({
                target: accounts.userId,
                set: { updatedAt: new Date() }
            })
        console.log(`[createOrUpdateUserAccount] Successfully inserted/updated account for userId: ${userId}`)

        console.log(`[createOrUpdateUserAccount] Fetching account details for userId: ${userId}`)
        const [account] = await db.select()
            .from(accounts)
            .where(eq(accounts.userId, userId))
            .limit(1)

        if (!account) {
            console.error(`[createOrUpdateUserAccount] Account not found after insertion for userId: ${userId}`)
            throw new Error(`Account not found for userId: ${userId}`)
        }
        console.log(`[createOrUpdateUserAccount] Account found with ID: ${account.id}, welcomeEmailSent: ${account.welcomeEmailSent}`)

        if (account.welcomeEmailSent) {
            console.log(`[createOrUpdateUserAccount] Welcome email already sent for userId: ${userId}, skipping email send`)
            return
        }

        console.log(`[createOrUpdateUserAccount] Creating Supabase admin client for userId: ${userId}`)
        const supabase = await createAdminClient()
        console.log(`[createOrUpdateUserAccount] Fetching user details from Supabase for userId: ${userId}`)
        const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)

        if (error) {
            console.error(`[createOrUpdateUserAccount] Failed to fetch user from Supabase for userId: ${userId}`, error)
            throw new Error(`Failed to fetch user: ${error.message}`)
        }

        if (!user) {
            console.error(`[createOrUpdateUserAccount] User not found in Supabase for userId: ${userId}`)
            throw new Error(`User not found in Supabase: ${userId}`)
        }
        console.log(`[createOrUpdateUserAccount] User found in Supabase - email: ${user.email}, name: ${user.user_metadata?.name || 'not set'}`)

        console.log(`[createOrUpdateUserAccount] Sending welcome email for userId: ${userId}`)
        await sendWelcomeEmail({
            email: user.email!,
            name: user.user_metadata?.name || 'there',
            userId: userId
        })
        console.log(`[createOrUpdateUserAccount] Welcome email sent successfully for userId: ${userId}`)
        
        console.log(`[createOrUpdateUserAccount] Process completed successfully for userId: ${userId}`)
    } catch (e) {
        console.error(`[createOrUpdateUserAccount] Failed to create user account for userId: ${userId}`, e)
        throw e
    }
}
