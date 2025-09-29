import { Redis } from '@upstash/redis'
import env from '@/src/lib/env'

let redisInstance: Redis | null = null

export const redis = {
  get: async (key: string) => {
    if (!redisInstance) {
      redisInstance = new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    }
    return redisInstance.get(key)
  },
  set: async (key: string, value: any) => {
    if (!redisInstance) {
      redisInstance = new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    }
    return redisInstance.set(key, value)
  }
}
