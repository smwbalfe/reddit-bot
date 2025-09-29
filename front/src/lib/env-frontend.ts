const frontendEnv = {
    NODE_ENV: process.env.NODE_ENV!,
    
    NEXT_PUBLIC_APP_URL: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://dash.sublead.app',
    
    FASTAPI_SERVER_URL: process.env.NODE_ENV === 'development'
        ? 'http://localhost:8001'
        : 'http://agent:8001',
    
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    NEXT_PUBLIC_STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
    
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    
    NEXT_PUBLIC_FREE_LEAD_LIMIT: parseInt(process.env.NEXT_PUBLIC_FREE_LEAD_LIMIT || '100'),
    NEXT_PUBLIC_FREE_REPLY_LIMIT: parseInt(process.env.NEXT_PUBLIC_FREE_REPLY_LIMIT || '15'),
}

console.log('Frontend Environment Variables:', {
    NODE_ENV: frontendEnv.NODE_ENV,
    NEXT_PUBLIC_APP_URL: frontendEnv.NEXT_PUBLIC_APP_URL,
    FASTAPI_SERVER_URL: frontendEnv.FASTAPI_SERVER_URL,
    NEXT_PUBLIC_SUPABASE_URL: frontendEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_KEY: frontendEnv.NEXT_PUBLIC_SUPABASE_KEY ? '[ REDACTED]' : undefined,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: frontendEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: frontendEnv.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: frontendEnv.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_STRIPE_PRICE_ID: frontendEnv.NEXT_PUBLIC_STRIPE_PRICE_ID,
})

export default frontendEnv
