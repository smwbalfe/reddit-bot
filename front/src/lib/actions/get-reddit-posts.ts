'use server'
import { db } from "@/src/lib/db"
import { redditPosts } from "@/src/lib/db/schema"
import { desc } from "drizzle-orm"

export async function getRedditPosts() {
  try {
    const posts = await db.select()
      .from(redditPosts)
      .orderBy(desc(redditPosts.createdAt))
      .limit(20)
    
    return posts
  } catch (error) {
    console.error('Error fetching Reddit posts:', error)
    throw new Error('Failed to fetch Reddit posts')
  }
} 