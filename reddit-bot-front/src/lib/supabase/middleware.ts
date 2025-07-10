import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { redis } from '../redis/redis'
import { STRIPE_SUB_CACHE } from '../stripe/types'
import env from '../env'

const premiumRoutes = ['/dashboard']

const createSupabaseClient = (request: NextRequest) => {
    console.log('[createSupabaseClient] Creating Supabase client for request')
    let supabaseResponse = NextResponse.next({ request })
    return {
        client: createServerClient(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.NEXT_PUBLIC_SUPABASE_KEY,
            {
                cookies: {
                    getAll() {
                        console.log('[createSupabaseClient] Getting all cookies')
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        console.log(`[createSupabaseClient] Setting ${cookiesToSet.length} cookies`)
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                        supabaseResponse = NextResponse.next({ request })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        ),
        response: supabaseResponse
    }
}

const redirectWithCookies = (request: NextRequest, path: string) => {
    console.log(`[redirectWithCookies] Redirecting to ${path}`)
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.redirect(url)
}

async function getStripeSubByUserId(userId: string) {
    console.log(`[getStripeSubByUserId] Fetching Stripe subscription for userId: ${userId}`)
    const stripeCustomerId = await redis.get(`user:${userId}:stripe-customer-id`)
    console.log(`[getStripeSubByUserId] Stripe customer ID: ${stripeCustomerId || 'not found'}`)
    if (!stripeCustomerId) return null
    const subStatus = await redis.get(`stripe:customer:${stripeCustomerId}:sub-status`)
    console.log(`[getStripeSubByUserId] Subscription status: ${subStatus || 'not found'}`)
    return subStatus
}

async function checkSubscription(userId: string) {
    console.log(`[checkSubscription] Checking subscription for userId: ${userId}`)
    const stripeSub = await getStripeSubByUserId(userId) as STRIPE_SUB_CACHE
    const isActive = stripeSub?.status === 'active'
    console.log(`[checkSubscription] Subscription active: ${isActive}`)
    return isActive
}

export async function updateSession(request: NextRequest) {
    console.log(`[updateSession] Processing request for path: ${request.nextUrl.pathname}`)
    const { client: supabase, response: supabaseResponse } = createSupabaseClient(request)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    const path = request.nextUrl.pathname
    console.log(`[updateSession] User: ${user?.id || 'not authenticated'}, Error: ${error?.message || 'none'}`)

    if (error) {
        console.log(`[updateSession] Auth error detected: ${error.message}`)
        if(!path.startsWith('/auth')) {
            console.log(`[updateSession] Redirecting to /auth due to auth error`)
            return redirectWithCookies(request, '/auth')
        }
    }
    
    if (!user) {
        console.log(`[updateSession] No user found`)
        if (!path.startsWith('/auth')) {
            console.log(`[updateSession] Redirecting to /auth - user not authenticated`)
            return redirectWithCookies(request, '/auth')
        }
    } else {
        console.log(`[updateSession] User authenticated: ${user.id}`)
        if (path.startsWith('/auth')) {
            console.log(`[updateSession] Redirecting authenticated user to /`)
            return redirectWithCookies(request, '/')
        }
        if (premiumRoutes.includes(path)) {
            console.log(`[updateSession] Checking premium access for path: ${path}`)
            const hasAccess = await checkSubscription(user.id)
            if (!hasAccess) {
                console.log(`[updateSession] User ${user.id} lacks premium access, redirecting to /`)
                return NextResponse.redirect(new URL('/', request.url))
            }
            console.log(`[updateSession] User ${user.id} has premium access`)
        }
    }
    console.log(`[updateSession] Returning response for path: ${path}`)
    return supabaseResponse
}