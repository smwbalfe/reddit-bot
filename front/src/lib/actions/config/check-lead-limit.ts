'use server'
import { checkSubscription } from '@/src/lib/actions/payment/check-subscription'
import { getUserLeadCount } from '@/src/lib/actions/config/get-user-lead-count'
import { disableMonitoring } from '@/src/lib/actions/config/disable-monitoring'
import { enableMonitoring } from '@/src/lib/actions/config/enable-monitoring'

export async function checkLeadLimit() {
  try {
    const subscription = await checkSubscription()
    const leadCount = await getUserLeadCount()
    const limit = subscription.isSubscribed ? 500 : 100
    const isAtLimit = leadCount >= limit
    
  
    if (!subscription.isSubscribed) {
      if (isAtLimit) {
        await disableMonitoring()
      } else if (leadCount < limit * 0.95) { 
        await enableMonitoring()
      }
    } else {
      await enableMonitoring()
    }
    
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