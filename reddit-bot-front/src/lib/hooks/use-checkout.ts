'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { createCheckoutSession } from '@/src/lib/actions/checkout-session'
import { supabaseBrowserClient } from '@/src/lib/supabase/client'
import env from '@/src/lib/env'

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export const useCheckout = (userId: string | undefined) => {
    const [isLoading, setIsLoading] = useState(false)
    const handleCheckout = async () => {
        if (!userId) {
            alert('User ID is required')
            return
        }
        setIsLoading(true)
        try {
            const { data } = await supabaseBrowserClient.auth.getUser()
            const email = data.user?.email || ''
            const name = data.user?.user_metadata?.name || ''
            
            const result = await createCheckoutSession({
                userId, 
                email,
                name,
                line_item: {
                    price: 'price_1R7iY4P74SCuSPeLfB4MSpuy', 
                    quantity: 1
                }
            })
            
            if (result.sessionId) {
                const stripe = await stripePromise
                if (!stripe) {
                    throw new Error('Stripe failed to initialize')
                }
                const { error } = await stripe.redirectToCheckout({
                    sessionId: result.sessionId
                })
                if (error) {
                    throw new Error(error.message)
                }
            } else {
                throw new Error(result.error || 'Checkout session creation failed')
            }
        } catch (error) {
            console.error('Checkout error:', error)
            alert(error instanceof Error ? error.message : 'An error occurred during checkout')
        } finally {
            setIsLoading(false)
        }
    }
    return { handleCheckout, isLoading }
}