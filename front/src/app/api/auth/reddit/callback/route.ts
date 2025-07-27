import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/lib/db'
import { accounts } from '@/src/lib/db/schema'
import { eq } from 'drizzle-orm'
import env from '@/src/lib/env'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    if (error) {
        return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard?error=reddit_auth_failed`)
    }
    
    if (!code || !state) {
        return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_code_or_state`)
    }
    
    const userId = state.split('-')[0]
    
    try {
        const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'reddit-bot/1.0'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/reddit/callback`
            })
        })
        
        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for token')
        }
        
        const tokenData = await tokenResponse.json()
        
        const meResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'User-Agent': 'reddit-bot/1.0'
            }
        })
        
        if (!meResponse.ok) {
            throw new Error('Failed to get user info')
        }
        
        const userData = await meResponse.json()
        
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))
        
        await db.update(accounts)
            .set({
                redditAccessToken: tokenData.access_token,
                redditRefreshToken: tokenData.refresh_token,
                redditUsername: userData.name,
                redditTokenExpiresAt: expiresAt,
                updatedAt: new Date()
            })
            .where(eq(accounts.userId, userId))
        
        return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard?success=reddit_connected`)
        
    } catch (error) {
        console.error('Reddit OAuth error:', error)
        return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard?error=reddit_auth_failed`)
    }
} 