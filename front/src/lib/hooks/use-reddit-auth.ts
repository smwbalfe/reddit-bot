import { useState, useEffect } from 'react'
import { useUser } from '@/src/lib/features/auth/hooks/use-user'
import { initiateRedditAuth, disconnectReddit } from '@/src/lib/services/reddit-auth'
import { supabaseBrowserClient } from '@/src/lib/supabase/client'

interface RedditAuthState {
    isConnected: boolean
    username: string | null
    isLoading: boolean
}

export function useRedditAuth() {
    const { user } = useUser()
    const [state, setState] = useState<RedditAuthState>({
        isConnected: false,
        username: null,
        isLoading: true
    })

    const checkRedditConnection = async () => {
        if (!user?.id) {
            setState({ isConnected: false, username: null, isLoading: false })
            return
        }

        try {
            const { data, error } = await supabaseBrowserClient
                .from('Account')
                .select('redditUsername, redditAccessToken')
                .eq('userId', user.id)
                .single()

            if (error) throw error

            setState({
                isConnected: !!data?.redditAccessToken,
                username: data?.redditUsername || null,
                isLoading: false
            })
        } catch (error) {
            console.error('Failed to check Reddit connection:', error)
            setState({ isConnected: false, username: null, isLoading: false })
        }
    }

    useEffect(() => {
        checkRedditConnection()
    }, [user?.id])

    const connect = () => {
        if (user?.id) {
            initiateRedditAuth(user.id)
        }
    }

    const disconnect = async () => {
        if (user?.id) {
            await disconnectReddit(user.id)
            await checkRedditConnection()
        }
    }

    return {
        ...state,
        connect,
        disconnect,
        refresh: checkRedditConnection
    }
} 