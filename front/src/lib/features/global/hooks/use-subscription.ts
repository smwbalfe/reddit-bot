'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/lib/features/auth/context/auth-context'

export const useSubscription = () => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setIsSubscribed(false)
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/subscription/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const { isSubscribed: subscribed } = await response.json()
          setIsSubscribed(subscribed)
        } else {
          setIsSubscribed(false)
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        setIsSubscribed(false)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user])

  return { isSubscribed, loading }
}