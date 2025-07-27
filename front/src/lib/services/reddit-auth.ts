import { db } from '@/src/lib/db'
import { accounts } from '@/src/lib/db/schema'
import { eq } from 'drizzle-orm'
import env from '@/src/lib/env'

export async function initiateRedditAuth(userId: string) {
    const authUrl = `${env.NEXT_PUBLIC_APP_URL}/api/auth/reddit?userId=${userId}`
    window.location.href = authUrl
}

export async function getRedditTokenForUser(userId: string) {
    const [account] = await db.select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .limit(1)
    
    if (!account?.redditAccessToken) {
        return null
    }
    
    if (account.redditTokenExpiresAt && new Date() > account.redditTokenExpiresAt) {
        if (account.redditRefreshToken) {
            return await refreshRedditToken(userId, account.redditRefreshToken)
        }
        return null
    }
    
    return {
        accessToken: account.redditAccessToken,
        username: account.redditUsername
    }
}

export async function refreshRedditToken(userId: string, refreshToken: string) {
    try {
        const response = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'reddit-bot/1.0'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        })
        
        if (!response.ok) {
            throw new Error('Failed to refresh token')
        }
        
        const tokenData = await response.json()
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))
        
        await db.update(accounts)
            .set({
                redditAccessToken: tokenData.access_token,
                redditTokenExpiresAt: expiresAt,
                updatedAt: new Date()
            })
            .where(eq(accounts.userId, userId))
        
        return {
            accessToken: tokenData.access_token,
            username: null
        }
    } catch (error) {
        console.error('Failed to refresh Reddit token:', error)
        return null
    }
}

export async function disconnectReddit(userId: string) {
    await db.update(accounts)
        .set({
            redditAccessToken: null,
            redditRefreshToken: null,
            redditUsername: null,
            redditTokenExpiresAt: null,
            updatedAt: new Date()
        })
        .where(eq(accounts.userId, userId))
} 