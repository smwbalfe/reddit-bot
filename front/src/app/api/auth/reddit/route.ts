import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import env from '@/src/lib/env'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const state = `${userId}-${Date.now()}`
    const scope = 'identity read submit'
    
    const redditAuthUrl = new URL('https://www.reddit.com/api/v1/authorize')
    redditAuthUrl.searchParams.set('client_id', env.REDDIT_CLIENT_ID)
    redditAuthUrl.searchParams.set('response_type', 'code')
    redditAuthUrl.searchParams.set('state', state)
    redditAuthUrl.searchParams.set('redirect_uri', `${env.NEXT_PUBLIC_APP_URL}/api/auth/reddit/callback`)
    redditAuthUrl.searchParams.set('duration', 'permanent')
    redditAuthUrl.searchParams.set('scope', scope)
    
    return NextResponse.redirect(redditAuthUrl.toString())
} 