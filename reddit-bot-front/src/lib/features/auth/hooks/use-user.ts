import { useState, useEffect } from 'react'
import { supabaseBrowserClient } from '@/src/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export const useUser = () => {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)
    const router = useRouter()

    useEffect(() => {
        const initializeAuth = async () => {
            console.log('initializing auth')
            const { data } = await supabaseBrowserClient.auth.getUser()
            setUser(data.user || null)
            setLoading(false)
        }

        initializeAuth()

        const { data: { subscription } } = supabaseBrowserClient.auth.onAuthStateChange(async (event, _session) => {
            setUser(_session?.user || null)
            if (event === 'SIGNED_OUT') {
                if (window.location.pathname !== '/auth') {
                    router.push('/auth')
                }
            } else if (event === 'SIGNED_IN') {
                if (window.location.pathname === '/auth') {
                    router.push('/')
                } else {
                    router.refresh()
                }
            } else if (event === 'TOKEN_REFRESHED') {
                router.refresh()
            }
        })

        return () => {
            subscription?.unsubscribe()
        }
    }, [router])

    return { user, loading }
}