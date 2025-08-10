import { ICP } from '@/src/lib/db/schema'
import { PostWithConfigId } from '@/src/lib/types'

export interface DashboardState {
  configs: ICP[]
  posts: PostWithConfigId[]
  isLoading: boolean
  error: string | null
}

export interface DashboardActions {
  fetchConfigs: () => Promise<void>
  fetchPosts: () => Promise<void>
  fetchDashboardData: () => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export interface DashboardMetrics {
  totalLeads: number
  avgLeadQuality: number
  todayLeads: number
  weekLeads: number
  leadDistribution: {
    neverLeads: number
    minimalLeads: number
    moderateLeads: number
    genuineLeads: number
    strongLeads: number
    readyLeads: number
  }
}

export interface DashboardLayoutProps {
  children: React.ReactNode
}