import { NextRequest } from 'next/server'
import { checkSubscription } from '@/src/lib/actions/payment/check-subscription'

export async function GET(request: NextRequest) {
  try {
    const result = await checkSubscription()
    return Response.json(result)
  } catch (error) {
    console.error('Error checking subscription:', error)
    return Response.json({ isSubscribed: false }, { status: 500 })
  }
}