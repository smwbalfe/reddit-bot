"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabaseBrowserClient } from '@/src/lib/services/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initializeAuth = async () => {
      const { data } = await supabaseBrowserClient.auth.getUser()
      setUser(data.user || null)
      setLoading(false)
    }

    initializeAuth()

    const { data: { subscription } } = supabaseBrowserClient.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      
      if (event === 'SIGNED_OUT') {
        if (window.location.pathname !== '/auth') {
          router.push('/auth')
        }
      } else if (event === 'SIGNED_IN') {
        if (window.location.pathname === '/auth') {
          router.push('/')
        }
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    await supabaseBrowserClient.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

