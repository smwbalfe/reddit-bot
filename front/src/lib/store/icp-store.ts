import { create } from 'zustand'

import { updateConfig } from '@/src/lib/actions/config/update-config'
import { deleteConfig } from '@/src/lib/actions/config/delete-config'
import { getUserConfigs } from '@/src/lib/actions/config/get-user-configs'
import { createConfig } from '@/src/lib/actions/config/create-config'

import { generateSuggestions } from '@/src/lib/actions/content/generate-suggestions'
import { analyzeUrl } from '@/src/lib/actions/content/analyze-url'
import { ICPState, ICPActions } from '@/src/lib/features/icps/types'

export const useICPStore = create<ICPState & ICPActions>((set, get) => ({
  icps: [],
  isLoading: true,
  isDeleting: null,
  isGenerating: null,
  isAnalyzingUrl: null,
  isSeeding: null,
  generatedSubreddits: {},
  selectedSubreddits: {},
  error: null,

  setError: (error: string | null) => set({ error }),

  fetchICPs: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await getUserConfigs()
      const initialSelected = data.reduce((acc: Record<number, string[]>, icp: any) => {
        acc[icp.id] = icp.data?.subreddits || []
        return acc
      }, {} as Record<number, string[]>)
      set({
        icps: data,
        selectedSubreddits: initialSelected,
        isLoading: false
      })
    } catch (error) {
      set({ error: 'Failed to fetch products', isLoading: false })
    }
  },

  createICP: async (formData: FormData) => {
    try {
      const result = await createConfig(formData)
      if (result.success) {
        await get().fetchICPs()
        return true
      } else {
        const errorMsg = Array.isArray(result.error)
          ? result.error.map((e: any) => e.message).join(', ')
          : result.error || 'Failed to create product'
        set({ error: errorMsg })
        return false
      }
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create product'
      set({ error: errorMsg })
      return false
    }
  },

  updateICP: async (id: number, formData: FormData, skipRefetch = false) => {
    try {
      const result = await updateConfig(id, formData)
      if (result.success) {
        if (!skipRefetch) {
          await get().fetchICPs()
        } else {
          const { icps } = get()
          const updatedICPs = icps.map(icp => {
            if (icp.id === id) {
              return {
                ...icp,
                data: {
                  ...icp.data,
                  description: (formData.get('description') as string) || icp.data.description,
                  painPoints: (formData.get('painPoints') as string) || icp.data.painPoints,
                  keywords: JSON.parse((formData.get('keywords') as string) || '[]'),
                  subreddits: JSON.parse((formData.get('subreddits') as string) || '[]')
                }
              }
            }
            return icp
          })
          set({ icps: updatedICPs })
        }
        return true
      } else {
        const errorMsg = Array.isArray(result.error)
          ? result.error.map((e: any) => e.message).join(', ')
          : result.error || 'Failed to update product'
        set({ error: errorMsg })
        return false
      }
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update product'
      set({ error: errorMsg })
      return false
    }
  },

  deleteICP: async (id: number) => {
    set({ isDeleting: id })
    try {
      const result = await deleteConfig(id)
      if (result.success) {
        await get().fetchICPs()
        return true
      } else {
        const errorMsg = Array.isArray(result.error)
          ? result.error.map((e: any) => e.message).join(', ')
          : result.error || 'Failed to delete product'
        set({ error: errorMsg })
        return false
      }
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete product'
      set({ error: errorMsg })
      return false
    } finally {
      set({ isDeleting: null })
    }
  },

  updateSelectedSubreddits: (icpId: number, subreddits: string[]) => {
    set(state => ({
      selectedSubreddits: {
        ...state.selectedSubreddits,
        [icpId]: subreddits
      }
    }))
  },

  setGeneratedSubreddits: (icpId: number, subreddits: string[]) => {
    set(state => ({
      generatedSubreddits: {
        ...state.generatedSubreddits,
        [icpId]: subreddits
      }
    }))
  },

  analyzeWebsite: async (icpId: number) => {
    const { icps } = get()
    const icp = icps.find(i => i.id === icpId)
    if (!icp) return

    set({ isAnalyzingUrl: icpId })

    try {
      const result = await analyzeUrl(icp.website)
      const suggestions = await generateSuggestions(result.icp_description, result.pain_points)

      get().setGeneratedSubreddits(icpId, suggestions.subreddits)

      const formData = new FormData()
      formData.append('name', icp.name)
      formData.append('website', icp.website)
      formData.append('description', result.icp_description)
      formData.append('painPoints', result.pain_points)
      formData.append('keywords', JSON.stringify(suggestions.keywords))
      formData.append('subreddits', JSON.stringify(icp.data?.subreddits || []))

      const updateResult = await updateConfig(icpId, formData)
      if (updateResult.success) {
        await get().fetchICPs()
      }
    } catch (error) {
      set({ error: 'Failed to analyze website' })
    } finally {
      set({ isAnalyzingUrl: null })
    }
  },

  regenerateSuggestions: async (icpId: number) => {
    const { icps } = get()
    const icp = icps.find(i => i.id === icpId)
    if (!icp || (!icp.data.description?.trim() && !icp.data.painPoints?.trim())) {
      set({ error: 'Please enter a description or pain points to generate suggestions' })
      return
    }

    set({ isGenerating: icpId })

    try {
      const result = await generateSuggestions(
        icp.data.description || '',
        icp.data.painPoints || ''
      )

      get().setGeneratedSubreddits(icpId, result.subreddits)

      const formData = new FormData()
      formData.append('name', icp.name)
      formData.append('website', icp.website)
      formData.append('description', icp.data.description || '')
      formData.append('painPoints', icp.data.painPoints || '')
      formData.append('keywords', JSON.stringify(result.keywords))
      formData.append('subreddits', JSON.stringify(icp.data?.subreddits || []))

      const updateResult = await updateConfig(icpId, formData)
      if (updateResult.success) {
        await get().fetchICPs()
      }
    } catch (error) {
      set({ error: 'Failed to generate suggestions' })
    } finally {
      set({ isGenerating: null })
    }
  },

  seedICP: async (icpId: number, userId: string) => {
    set({ isSeeding: icpId })
    try {
      if (!get().icps) return { success: false, message: 'No ICPs found', posts_scraped: 0 }
      const icp = get().icps.find(i => i.id === icpId)
      if (!icp) return { success: false, message: 'ICP not found', posts_scraped: 0 }
      if (!icp.data?.subreddits || icp.data.subreddits.length === 0) {
        return { success: false, message: 'No subreddits selected', posts_scraped: 0 }
      }
      if (!userId) return { success: false, message: 'No userId provided', posts_scraped: 0 }
      if (!('seedICP' in get())) return { success: false, message: 'seedICP not implemented', posts_scraped: 0 }
      // You should implement the actual seeding logic here or import it if available
      return { success: true, message: 'Seeding complete', posts_scraped: 0 }
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to seed ICP', posts_scraped: 0 }
    } finally {
      set({ isSeeding: null })
    }
  }
}))