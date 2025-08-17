'use server'
import { db } from "@/src/lib/db"
import { accounts } from "@/src/lib/db/schema"
import { eq } from "drizzle-orm"

export async function markIcpsVisited(userId: string) {
    console.log(`[markIcpsVisited] Marking ICPS as visited for userId: ${userId}`)
    
    try {
        await db.update(accounts)
            .set({ 
                hasVisitedIcps: true,
                updatedAt: new Date() 
            })
            .where(eq(accounts.userId, userId))
        
        console.log(`[markIcpsVisited] Successfully marked ICPS as visited for userId: ${userId}`)
    } catch (error) {
        console.error(`[markIcpsVisited] Failed to mark ICPS as visited for userId: ${userId}`, error)
        throw error
    }
}