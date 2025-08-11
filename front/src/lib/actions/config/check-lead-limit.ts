'use server'
import { checkSubscription } from '@/src/lib/actions/payment/check-subscription'
import { getUserLeadCount } from '@/src/lib/actions/config/get-user-lead-count'

export async function checkLeadLimit() {
  try {
    const subscription = await checkSubscription()
    const leadCount = await getUserLeadCount()
    const limit = subscription.isSubscribed ? 100 : 15
    const isAtLimit = leadCount >= limit
    
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