import { create } from 'zustand'
import { getUserConfigs } from '@/src/lib/actions/config/get-user-configs'
import { getUserPosts } from '@/src/lib/actions/config/get-user-posts'
import { DashboardState, DashboardActions } from '@/src/lib/features/dashboard/types'

export const useDashboardStore = create<DashboardState & DashboardActions>((set, get) => ({
  configs: [],
  posts: [],
  isLoading: true,
  error: null,

  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),

  fetchConfigs: async () => {
    try {
      const data = await getUserConfigs()
      set({ configs: data })
    } catch (error) {
      console.error('Error fetching configs:', error)
      set({ error: 'Failed to fetch configs' })
    }
  },

  fetchPosts: async () => {
    try {
      const data = await getUserPosts()
      set({ posts: data })
    } catch (error) {
      console.error('Error fetching posts:', error)
      set({ error: 'Failed to fetch posts' })
    }
  },

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null })
    try {
      await Promise.all([
        get().fetchConfigs(),
        get().fetchPosts()
      ])
    } finally {
      set({ isLoading: false })
    }
  }
}))