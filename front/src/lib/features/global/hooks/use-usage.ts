'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/src/lib/features/auth/hooks/use-user'
import { checkLeadLimit } from '@/src/lib/actions/config/check-lead-limit'
import { getUserUsage } from '@/src/lib/actions/usage/get-user-usage'

interface UsageData {
    repliesGenerated: number
    leadCount: number
    limit: number
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
                const [leadData, usageData] = await Promise.all([
                    checkLeadLimit(),
                    getUserUsage()
                ])

                setUsage({
                    repliesGenerated: usageData.repliesGenerated,
                    leadCount: leadData.leadCount,
                    limit: leadData.limit,
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