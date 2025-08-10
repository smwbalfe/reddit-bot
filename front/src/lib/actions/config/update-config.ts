'use server'
import { db } from "@/src/lib/db"
import { icps } from "@/src/lib/db/schema"
import { eq } from "drizzle-orm"
import { makeServerClient } from '@/src/lib/services/supabase/server'
import { z } from 'zod'
import { notifyConfigChange } from '@/src/lib/actions/notifications/notify-config-change'

const createIcpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url('Must be a valid URL'),
  description: z.string().min(1, 'Description is required'),
  keywords: z.array(z.string()).default([]),
  subreddits: z.array(z.string()).default([]),
  painPoints: z.string().default(''),
})

export async function updateConfig(id: number, formData: FormData) {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
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

    const [config] = await db.update(icps)
      .set({
        name: validatedData.name,
        website: validatedData.website,
        data: {
          keywords: validatedData.keywords,
          subreddits: validatedData.subreddits,
          painPoints: validatedData.painPoints,
          description: validatedData.description,
        },
        updatedAt: new Date(),
      })
      .where(eq(icps.id, id))
      .returning()

    // Notify backend about config update
    const notifyResult = await notifyConfigChange('update', config.id)
    if (!notifyResult.success) {
      console.warn('Failed to notify backend about config update:', notifyResult.error)
    }

    return { success: true, data: config }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues }
    }
    console.error('Error updating config:', error)
    return { success: false, error: 'Failed to update config' }
  }
}