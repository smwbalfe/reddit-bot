import { useMemo } from 'react'
import { PostWithConfigId } from '../types'
import { DashboardMetrics } from '../features/dashboard/types'

export const useDashboardMetrics = (posts: PostWithConfigId[]): DashboardMetrics => {
  return useMemo(() => {
    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const neverLeads = posts.filter(post => (post.leadQuality ?? 0) <= 10).length
    const minimalLeads = posts.filter(post => (post.leadQuality ?? 0) > 10 && (post.leadQuality ?? 0) <= 20).length
    const moderateLeads = posts.filter(post => (post.leadQuality ?? 0) > 20 && (post.leadQuality ?? 0) <= 40).length
    const genuineLeads = posts.filter(post => (post.leadQuality ?? 0) > 40 && (post.leadQuality ?? 0) <= 60).length
    const strongLeads = posts.filter(post => (post.leadQuality ?? 0) > 60 && (post.leadQuality ?? 0) <= 80).length
    const readyLeads = posts.filter(post => (post.leadQuality ?? 0) > 80).length

    const avgLeadQuality = posts.length > 0 
      ? Math.round(posts.reduce((acc, post) => acc + (post.leadQuality ?? 0), 0) / posts.length) 
      : 0

    const todayLeads = posts.filter(post => {
      const postDate = new Date(post.createdAt)
      return postDate.toDateString() === today.toDateString()
    }).length

    const weekLeads = posts.filter(post => {
      const postDate = new Date(post.createdAt)
      return postDate >= weekAgo
    }).length

    return {
      totalLeads: posts.length,
      avgLeadQuality,
      todayLeads,
      weekLeads,
      leadDistribution: {
        neverLeads,
        minimalLeads,
        moderateLeads,
        genuineLeads,
        strongLeads,
        readyLeads
      }
    }
  }, [posts])
}