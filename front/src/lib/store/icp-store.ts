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

  setError: (error) => set({ error }),

  fetchICPs: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await getUserConfigs()
      const initialSelected = data.reduce((acc, icp) => {
        acc[icp.id] = icp.data?.subreddits || []
        return acc
      }, {} as Record<number, string[]>)
      
      set({ 
        icps: data, 
        selectedSubreddits: initialSelected,
        isLoading: false 
      })
    } catch (error) {
      console.error('Error fetching ICPs:', error)
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
          ? result.error.map(e => e.message).join(', ')
          : result.error || 'Failed to create product'
        set({ error: errorMsg })
        return false
      }
    } catch (error) {
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
                  description: formData.get('description') as string || icp.data.description,
                  painPoints: formData.get('painPoints') as string || icp.data.painPoints,
                  keywords: JSON.parse(formData.get('keywords') as string || '[]'),
                  subreddits: JSON.parse(formData.get('subreddits') as string || '[]')
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
          ? result.error.map(e => e.message).join(', ')
          : result.error || 'Failed to update product'
        set({ error: errorMsg })
        return false
      }
    } catch (error) {
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
          ? result.error.map(e => e.message).join(', ')
          : result.error || 'Failed to delete product'
        set({ error: errorMsg })
        return false
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete product'
      set({ error: errorMsg })
      return false
    } finally {
      set({ isDeleting: null })
    }
  },

  updateSelectedSubreddits: (icpId, subreddits) => {
    set(state => ({
      selectedSubreddits: {
        ...state.selectedSubreddits,
        [icpId]: subreddits
      }
    }))
  },

  setGeneratedSubreddits: (icpId, subreddits) => {
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
      const response = await fetch('http://localhost:8000/api/seed-icp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          icp_id: icpId,
          user_id: userId,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to seed ICP')
      }
      
      const result = await response.json()
      
      // Refresh ICPs to get updated seeded status
      await get().fetchICPs()
      
      return {
        success: true,
        message: result.message,
        posts_scraped: result.posts_scraped
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to seed ICP'
      set({ error: errorMsg })
      return {
        success: false,
        message: errorMsg,
        posts_scraped: 0
      }
    } finally {
      set({ isSeeding: null })
    }
  }
}))