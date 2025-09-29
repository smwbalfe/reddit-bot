'use server'
import Stripe from 'stripe';
import env from '@/src/lib/env-backend';
import { STRIPE_CUSTOMER_ID_KV } from '@/src/lib/services/stripe/stripe';
import { CheckoutRequestBody } from '@/src/lib/types';

export async function createCheckoutSession(formData: CheckoutRequestBody) {
    const { userId, email, line_item } = formData;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-06-30.basil'
    });
    console.log('createCheckoutSession called with:', { userId, email, line_item });

    if (!userId) {
        throw new Error('User ID is required');
    }

    try {
        let stripeCustomerId = await STRIPE_CUSTOMER_ID_KV.get(userId);
        
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email,
                metadata: { userId }
            });
            await STRIPE_CUSTOMER_ID_KV.set(userId, customer.id);
            stripeCustomerId = customer.id;
        }

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId as string,
            payment_method_types: ['card'],
            line_items: [{
                price: line_item.price,
                quantity: line_item.quantity
            }],
            mode: 'subscription',
            success_url: `${env.NEXT_PUBLIC_APP_URL}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${env.NEXT_PUBLIC_APP_URL}/`,
            subscription_data: {
                metadata: { 
                    userId: userId
                }
            }
        });
        
        return { success: true, sessionId: session.id };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred' };
    }
}