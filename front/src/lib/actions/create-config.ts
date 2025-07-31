'use server'
import { db } from "@/src/lib/db"
import { icps, redditPosts } from "@/src/lib/db/schema"
import { eq } from "drizzle-orm"
import { makeServerClient } from '@/src/lib/supabase/server'
import { z } from 'zod'

const createIcpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url('Must be a valid URL'),
  description: z.string().min(1, 'Description is required'),
  keywords: z.array(z.string()).default([]),
  subreddits: z.array(z.string()).default([]),
})

export async function createConfig(formData: FormData) {
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
    }

    const validatedData = createIcpSchema.parse(rawData)

    const [config] = await db.insert(icps).values({
      userId: user.id,
      name: validatedData.name,
      website: validatedData.website,
      description: validatedData.description,
      keywords: validatedData.keywords,
      subreddits: validatedData.subreddits,
    }).returning()

    return { success: true, data: config }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues }
    }
    console.error('Error creating config:', error)
    return { success: false, error: 'Failed to create config' }
  }
}

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

export async function getUserPosts() {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const userPosts = await db.select({
      id: redditPosts.id,
      configId: redditPosts.icpId,
      subreddit: redditPosts.subreddit,
      title: redditPosts.title,
      content: redditPosts.content,
      url: redditPosts.url,
      leadQuality: redditPosts.leadQuality,
      leadCategory: redditPosts.leadCategory,
      justification: redditPosts.justification,
      painPoints: redditPosts.painPoints,
      createdAt: redditPosts.createdAt,
      updatedAt: redditPosts.updatedAt,
    })
      .from(redditPosts)
      .innerJoin(icps, eq(redditPosts.icpId, icps.id))
      .where(eq(icps.userId, user.id))
    
    return userPosts
  } catch (error) {
    console.error('Error fetching user posts:', error)
    throw new Error('Failed to fetch user posts')
  }
}

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
    }

    const validatedData = createIcpSchema.parse(rawData)

    const [config] = await db.update(icps)
      .set({
        name: validatedData.name,
        website: validatedData.website,
        description: validatedData.description,
        keywords: validatedData.keywords,
        subreddits: validatedData.subreddits,
        updatedAt: new Date(),
      })
      .where(eq(icps.id, id))
      .returning()

    return { success: true, data: config }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues }
    }
    console.error('Error updating config:', error)
    return { success: false, error: 'Failed to update config' }
  }
}

export async function deleteConfig(id: number) {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    await db.delete(redditPosts).where(eq(redditPosts.icpId, id))
    await db.delete(icps).where(eq(icps.id, id))
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting config:', error)
    return { success: false, error: 'Failed to delete config' }
  }
} 