'use server'
import { db } from "@/src/lib/db"
import { configs, redditPosts, NewConfig } from "@/src/lib/db/schema"
import { eq } from "drizzle-orm"

export async function createConfig(data: Omit<NewConfig, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const [config] = await db.insert(configs).values(data).returning()
    return config
  } catch (error) {
    console.error('Error creating config:', error)
    throw new Error('Failed to create config')
  }
}

export async function getUserConfigs(userId: string) {
  try {
    const userConfigs = await db.select()
      .from(configs)
      .where(eq(configs.userId, userId))
    
    return userConfigs
  } catch (error) {
    console.error('Error fetching user configs:', error)
    throw new Error('Failed to fetch user configs')
  }
}

export async function getUserPosts(userId: string) {
  try {
    const userPosts = await db.select({
      id: redditPosts.id,
      configId: redditPosts.configId,
      subreddit: redditPosts.subreddit,
      title: redditPosts.title,
      content: redditPosts.content,
      category: redditPosts.category,
      url: redditPosts.url,
      confidence: redditPosts.confidence,
      createdAt: redditPosts.createdAt,
      updatedAt: redditPosts.updatedAt,
    })
      .from(redditPosts)
      .innerJoin(configs, eq(redditPosts.configId, configs.id))
      .where(eq(configs.userId, userId))
    
    return userPosts
  } catch (error) {
    console.error('Error fetching user posts:', error)
    throw new Error('Failed to fetch user posts')
  }
}

export async function deleteConfig(id: number) {
  try {
    await db.delete(redditPosts).where(eq(redditPosts.configId, id))
    await db.delete(configs).where(eq(configs.id, id))
  } catch (error) {
    console.error('Error deleting config:', error)
    throw new Error('Failed to delete config')
  }
} 