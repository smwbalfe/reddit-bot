
import { redirect } from 'next/navigation';
import { STRIPE_CUSTOMER_ID_KV, syncStripeDataToKV } from '@/src/lib/stripe/stripe';
import { makeServerClient } from '@/src/lib/supabase/server';

export async function GET(req: Request) {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return redirect("/auth");
    }
    const stripeCustomerId = await STRIPE_CUSTOMER_ID_KV.get(user.id);
    if (!stripeCustomerId) {
        return redirect("/");
    }
    await syncStripeDataToKV(stripeCustomerId as string);
    return redirect("/dashboard");
}