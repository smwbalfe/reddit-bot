'use server'
import { checkSubscription } from '@/src/lib/actions/payment/check-subscription'
import { getUserLeadCount } from '@/src/lib/actions/config/get-user-lead-count'
import env from '@/src/lib/env'

export async function checkLeadLimit() {
  try {
    const subscription = await checkSubscription()
    const leadCount = await getUserLeadCount()
    const limit = subscription.isSubscribed ? null : 500 // Premium users have no limit, free users have 500
    const isAtLimit = subscription.isSubscribed ? false : leadCount >= (limit || 500)
    
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