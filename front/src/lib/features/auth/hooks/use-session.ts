"use client"

import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabaseBrowserClient } from '@/src/lib/services/supabase/client'

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabaseBrowserClient.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabaseBrowserClient.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { 
    session, 
    user: session?.user || null, 
    loading 
  }
}