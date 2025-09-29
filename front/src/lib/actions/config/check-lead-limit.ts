'use server'
import { checkSubscription } from '@/src/lib/actions/payment/check-subscription'
import { getUserLeadCount } from '@/src/lib/actions/config/get-user-lead-count'
import env from '@/src/lib/env-backend'

export async function checkLeadLimit() {
  try {
    const subscription = await checkSubscription()
    const leadCount = await getUserLeadCount()
    const limit = subscription.isSubscribed ? null : env.NEXT_PUBLIC_FREE_LEAD_LIMIT // Premium users have no limit, free users have env limit
    const isAtLimit = subscription.isSubscribed ? false : leadCount >= (limit || env.NEXT_PUBLIC_FREE_LEAD_LIMIT)
    
    return {
      leadCount,
      limit,
      isAtLimit,
      isSubscribed: subscription.isSubscribed
    }
  } catch (error) {
    console.error('Error checking lead limit:', error)
    throw new Error('Failed to check lead limit')
  }
}