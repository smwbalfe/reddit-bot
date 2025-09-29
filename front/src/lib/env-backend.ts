const backendEnv = {
    NODE_ENV: process.env.NODE_ENV!,
    
    NEXT_PUBLIC_APP_URL: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://dash.sublead.app',
    
    FASTAPI_SERVER_URL: process.env.NODE_ENV === 'development'
        ? 'http://localhost:8001'
        : 'http://agent:8001',
    
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    
    DATABASE_URL: process.env.DATABASE_URL || '',
    
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',

    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    RESEND_FROM: process.env.RESEND_FROM || '',
    NEXT_PUBLIC_STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
    
    NEXT_PUBLIC_FREE_LEAD_LIMIT: parseInt(process.env.NEXT_PUBLIC_FREE_LEAD_LIMIT || '100'),
    NEXT_PUBLIC_FREE_REPLY_LIMIT: parseInt(process.env.NEXT_PUBLIC_FREE_REPLY_LIMIT || '15'),
}

console.log('Backend Environment Variables:', {
    NODE_ENV: backendEnv.NODE_ENV,
    NEXT_PUBLIC_APP_URL: backendEnv.NEXT_PUBLIC_APP_URL,
    FASTAPI_SERVER_URL: backendEnv.FASTAPI_SERVER_URL,
    NEXT_PUBLIC_SUPABASE_URL: backendEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_KEY: backendEnv.NEXT_PUBLIC_SUPABASE_KEY ? '[REDACTED]' : undefined,
    SUPABASE_SERVICE_ROLE_KEY: backendEnv.SUPABASE_SERVICE_ROLE_KEY ? '[REDACTED]' : undefined,
    STRIPE_SECRET_KEY: backendEnv.STRIPE_SECRET_KEY ? '[REDACTED]' : undefined,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: backendEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: backendEnv.STRIPE_WEBHOOK_SECRET ? '[REDACTED]' : undefined,
    DATABASE_URL: backendEnv.DATABASE_URL ? '[REDACTED]' : undefined,
    UPSTASH_REDIS_REST_URL: backendEnv.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: backendEnv.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_POSTHOG_KEY: backendEnv.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: backendEnv.NEXT_PUBLIC_POSTHOG_HOST,
    RESEND_API_KEY: backendEnv.RESEND_API_KEY ? '[REDACTED]' : undefined,
    RESEND_FROM: backendEnv.RESEND_FROM,
    NEXT_PUBLIC_STRIPE_PRICE_ID: backendEnv.NEXT_PUBLIC_STRIPE_PRICE_ID,
    OPENROUTER_API_KEY: backendEnv.OPENROUTER_API_KEY ? '[REDACTED]' : undefined,
})

export default backendEnv
