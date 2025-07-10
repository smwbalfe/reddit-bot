import Stripe from "stripe";
import { redis } from "../redis/redis";
import { STRIPE_SUB_CACHE } from "./types";
import env from "../env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil'
});

export const STRIPE_CACHE_KV = {
    generateKey(stripeCustomerId: string) {
        return `stripe:customer:${stripeCustomerId}:sub-status`;
    },
    async get(stripeCustomerId: string): Promise<STRIPE_SUB_CACHE> {
        const response = await redis.get(this.generateKey(stripeCustomerId));
        if (!response) return { status: "none" };
        return response as STRIPE_SUB_CACHE
    },
    async set(stripeCustomerId: string, status: STRIPE_SUB_CACHE) {
        await redis.set(this.generateKey(stripeCustomerId), JSON.stringify(status));
    }
};

export const STRIPE_CUSTOMER_ID_KV = {
  generateKey(userId: string) {
    return `user:${userId}:stripe-customer-id`;
  },
  async get(userId: string) {
    return await redis.get(this.generateKey(userId));
  },
  async set(userId: string, customerId: string) {
    await redis.set(this.generateKey(userId), customerId);
  }
};

const allowedEvents: Stripe.Event.Type[] = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.resumed",
    "customer.subscription.pending_update_applied",
    "customer.subscription.pending_update_expired",
    "customer.subscription.trial_will_end",
    "invoice.paid",
    "invoice.payment_failed",
    "invoice.payment_action_required",
    "invoice.upcoming",
    "invoice.marked_uncollectible",
    "invoice.payment_succeeded",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "payment_intent.canceled",
    "payment_intent.requires_action",
    "payment_method.attached",
];

export async function processEvent(event: Stripe.Event) {
    if (!allowedEvents.includes(event.type)) return;

    const { customer: customerId } = event?.data?.object as {
        customer: string; 
    };

    if (typeof customerId !== "string") {
        throw new Error(
            `[STRIPE HOOK] ID isn't string.\nEvent type: ${event.type}`
        );
    }

    return await syncStripeDataToKV(customerId);
}

export async function syncStripeDataToKV(customerId: string) {
    
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
        status: "all",
        expand: ["data.default_payment_method"],
    });

    if (subscriptions.data.length === 0) {
        const subData: STRIPE_SUB_CACHE = { status: "none" };
        await STRIPE_CACHE_KV.set(customerId, subData);
        return subData;
    }

    const subscription = subscriptions.data[0];

    const subData = {
        subscriptionId: subscription.id,
        status: subscription.status,
        priceId: subscription.items.data[0].price.id,
        currentPeriodEnd: subscription.items.data[0].current_period_end,
        currentPeriodStart: subscription.items.data[0].current_period_start,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        paymentMethod:
            subscription.default_payment_method &&
                typeof subscription.default_payment_method !== "string"
                ? {
                    brand: subscription.default_payment_method.card?.brand ?? null,
                    last4: subscription.default_payment_method.card?.last4 ?? null,
                }
                : null,
    };
    await STRIPE_CACHE_KV.set(customerId, subData);
    return subData;
}