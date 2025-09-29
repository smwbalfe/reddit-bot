const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    NEXT_PUBLIC_APP_URL: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://dash.sublead.app',
    
    FASTAPI_SERVER_URL: process.env.NODE_ENV === 'development'
        ? 'http://localhost:8001'
        : 'http://agent:8001',
    
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    
    DATABASE_URL: process.env.DATABASE_URL || '',
    
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',

    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    RESEND_FROM: process.env.RESEND_FROM || '',
    NEXT_PUBLIC_STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '',
    
    NEXT_PUBLIC_FREE_LEAD_LIMIT: parseInt(process.env.NEXT_PUBLIC_FREE_LEAD_LIMIT || '100'),
    NEXT_PUBLIC_FREE_REPLY_LIMIT: parseInt(process.env.NEXT_PUBLIC_FREE_REPLY_LIMIT || '15'),
}

const redactValue = (value: string | number) => {
    if (typeof value === 'number') return value
    return value ? '[REDACTED]' : '[NOT SET]'
}

console.log('Environment Variables:', {
    NODE_ENV: env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    FASTAPI_SERVER_URL: env.FASTAPI_SERVER_URL,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL || '[NOT SET]',
    NEXT_PUBLIC_SUPABASE_KEY: redactValue(env.NEXT_PUBLIC_SUPABASE_KEY),
    SUPABASE_SERVICE_ROLE_KEY: redactValue(env.SUPABASE_SERVICE_ROLE_KEY),
    STRIPE_SECRET_KEY: redactValue(env.STRIPE_SECRET_KEY),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '[NOT SET]',
    STRIPE_WEBHOOK_SECRET: redactValue(env.STRIPE_WEBHOOK_SECRET),
    DATABASE_URL: redactValue(env.DATABASE_URL),
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL || '[NOT SET]',
    UPSTASH_REDIS_REST_TOKEN: redactValue(env.UPSTASH_REDIS_REST_TOKEN),
    NEXT_PUBLIC_POSTHOG_KEY: env.NEXT_PUBLIC_POSTHOG_KEY || '[NOT SET]',
    NEXT_PUBLIC_POSTHOG_HOST: env.NEXT_PUBLIC_POSTHOG_HOST,
    RESEND_API_KEY: redactValue(env.RESEND_API_KEY),
    RESEND_FROM: env.RESEND_FROM || '[NOT SET]',
    NEXT_PUBLIC_STRIPE_PRICE_ID: env.NEXT_PUBLIC_STRIPE_PRICE_ID || '[NOT SET]',
    OPENROUTER_API_KEY: redactValue(env.OPENROUTER_API_KEY),
    NEXT_PUBLIC_FREE_LEAD_LIMIT: env.NEXT_PUBLIC_FREE_LEAD_LIMIT,
    NEXT_PUBLIC_FREE_REPLY_LIMIT: env.NEXT_PUBLIC_FREE_REPLY_LIMIT,
})

export default env