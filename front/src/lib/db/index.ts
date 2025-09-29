import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import env from '@/src/lib/env'

let dbInstance: ReturnType<typeof drizzle> | null = null

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!dbInstance) {
      const client = postgres(env.DATABASE_URL, { prepare: false })
      dbInstance = drizzle(client)
    }
    return (dbInstance as any)[prop]
  }
})