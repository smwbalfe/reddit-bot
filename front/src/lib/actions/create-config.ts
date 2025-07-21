'use server'
import { db } from "@/src/lib/db"
import { configs, NewConfig } from "@/src/lib/db/schema"
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

export async function deleteConfig(id: number) {
  try {
    await db.delete(configs).where(eq(configs.id, id))
  } catch (error) {
    console.error('Error deleting config:', error)
    throw new Error('Failed to delete config')
  }
} 