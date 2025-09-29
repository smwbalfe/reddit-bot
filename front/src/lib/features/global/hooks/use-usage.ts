'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/src/lib/features/auth/hooks/use-user'
import { checkLeadLimit } from '@/src/lib/actions/config/check-lead-limit'
import { getUserUsage } from '@/src/lib/actions/usage/get-user-usage'
import { checkSubscription } from '@/src/lib/actions/payment/check-subscription'
import env from '@/src/lib/env-frontend'

interface UsageData {
    repliesGenerated: number
    leadsQualified: number
    leadCount: number
    limit: number | null  // lead limit (null for premium)
    replyLimit: number | null  // reply limit (null for premium)
    isAtLimit: boolean
    isSubscribed: boolean
}

export function useUsage() {
    const { user } = useUser()
    const [usage, setUsage] = useState<UsageData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchUsage() {
            if (!user) {
                setLoading(false)
                return
            }

            try {
                const [leadData, usageData, subscription] = await Promise.all([
                    checkLeadLimit(),
                    getUserUsage(),
                    checkSubscription()
                ])

                const replyLimit = subscription.isSubscribed ? null : env.NEXT_PUBLIC_FREE_REPLY_LIMIT

                setUsage({
                    repliesGenerated: usageData.repliesGenerated,
                    leadsQualified: usageData.leadsQualified,
                    leadCount: leadData.leadCount,
                    limit: leadData.limit,
                    replyLimit,
                    isAtLimit: leadData.isAtLimit,
                    isSubscribed: leadData.isSubscribed
                })
            } catch (error) {
                console.error('Error fetching usage:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUsage()
    }, [user])

    return { usage, loading }
}