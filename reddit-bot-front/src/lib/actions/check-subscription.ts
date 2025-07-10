"use server"
import { makeServerClient } from '../supabase/server'
import { STRIPE_SUB_CACHE } from '../stripe/types'
import { STRIPE_CACHE_KV, STRIPE_CUSTOMER_ID_KV } from '../stripe/stripe'

async function getStripeSubByUserId(userId: string) {
    const stripeCustomerId = await STRIPE_CUSTOMER_ID_KV.get(userId)

    if (!stripeCustomerId) return null

    return STRIPE_CACHE_KV.get(stripeCustomerId as string)
}

export async function checkSubscription() {
    const supabase = await makeServerClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) {
        return { isSubscribed: false }
    }
    const stripeSub = await getStripeSubByUserId(user.id) as STRIPE_SUB_CACHE
    return { isSubscribed: stripeSub?.status === 'active' }
}