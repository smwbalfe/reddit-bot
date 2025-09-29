import Stripe from "stripe";
import { redis } from "@/src/lib/services/redis/redis";
import { STRIPE_SUB_CACHE } from "@/src/lib/services/stripe/types";
import { db } from "@/src/lib/db";
import { icps } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import env from "@/src/lib/env-backend";

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
    await redis.set(`stripe-customer:${customerId}:user-id`, userId);
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
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {  
        apiVersion: '2025-06-30.basil'
    });
    
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
        status: "all",
        expand: ["data.default_payment_method"],
    });

    if (subscriptions.data.length === 0) {
        const subData: STRIPE_SUB_CACHE = { status: "none" };
        await STRIPE_CACHE_KV.set(customerId, subData);
        await updateLeadLimitForCustomer(customerId, false);
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
    await updateLeadLimitForCustomer(customerId, subscription.status === "active");
    return subData;
}

async function updateLeadLimitForCustomer(customerId: string, isActive: boolean) {
    try {
        const userId = await redis.get(`stripe-customer:${customerId}:user-id`);
        if (!userId) {
            console.log(`[updateLeadLimit]  No user found for customer ${customerId}`);
            return;
        }
        const leadLimit = isActive ? 9999 : env.NEXT_PUBLIC_FREE_LEAD_LIMIT;
        await db.update(icps)
            .set({ leadLimit })
            .where(eq(icps.userId, userId as string));

        console.log(`[updateLeadLimit] Updated lead limit to ${leadLimit} for user ${userId}`);
    } catch (error) {
        console.error(`[updateLeadLimit] Error updating lead limit for customer ${customerId}:`, error);
    }
}