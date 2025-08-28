'use server'
import { db } from "@/src/lib/db"
import { icps } from "@/src/lib/db/schema"
import { eq } from "drizzle-orm"
import { makeServerClient } from '@/src/lib/services/supabase/server'
import { z } from 'zod'
import { notifyConfigChange } from '@/src/lib/actions/notifications/notify-config-change'
import { checkSubscription } from '@/src/lib/actions/payment/check-subscription'
import env from '@/src/lib/env'

const createIcpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url('Must be a valid URL'),
  description: z.string().min(1, 'Description is required'),
  keywords: z.array(z.string()).default([]),
  subreddits: z.array(z.string()).default([]),
  painPoints: z.string().default(''),
})

export async function createConfig(formData: FormData) {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const existingIcps = await db.select()
      .from(icps)
      .where(eq(icps.userId, user.id))
    
    if (existingIcps.length >= 3) {
      return { success: false, error: 'You can only create up to 3 products per account. Please delete an existing product to create a new one.' }
    }

    const rawData = {
      name: formData.get('name') as string,
      website: formData.get('website') as string,
      description: formData.get('description') as string,
      keywords: JSON.parse(formData.get('keywords') as string || '[]'),
      subreddits: JSON.parse(formData.get('subreddits') as string || '[]'),
      painPoints: formData.get('painPoints') as string || '',
    }

    const validatedData = createIcpSchema.parse(rawData)
    const subscription = await checkSubscription()
    const leadLimit = subscription.isSubscribed ? 9999 : env.NEXT_PUBLIC_FREE_LEAD_LIMIT

    const [config] = await db.insert(icps).values({
      userId: user.id,
      name: validatedData.name,
      website: validatedData.website,
      leadLimit,
      data: {
        keywords: validatedData.keywords,
        subreddits: validatedData.subreddits,
        painPoints: validatedData.painPoints,
        description: validatedData.description,
      },
    }).returning()

    const notifyResult = await notifyConfigChange('create', config.id)
    if (!notifyResult.success) {
      console.warn('Failed to notify backend about config creation:', notifyResult.error)
    }

    return { success: true, data: config }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues }
    }
    console.error('Error creating config:', error)
    return { success: false, error: 'Failed to create config' }
  }
}