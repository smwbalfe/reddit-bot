'use server'
import { db } from "@/src/lib/db"
import { redditPosts, NewRedditPost } from "@/src/lib/db/schema"

export async function createRedditPost(data: Omit<NewRedditPost, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const [post] = await db.insert(redditPosts).values(data).returning()
    return post
  } catch (error) {
    console.error('Error creating Reddit post:', error)
    throw new Error('Failed to create Reddit post')
  }
} 