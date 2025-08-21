import { create } from 'zustand'
import { FormState, FormActions } from '@/src/lib/store/types'
import { generateSuggestions } from '../actions/content/generate-suggestions'
import { analyzeUrl } from '../actions/content/analyze-url'

const initialState: FormState = {
  generatedSubreddits: [],
  selectedSubreddits: [],
  painPoints: '',
  icpDescription: '',
  isAnalyzing: false,
  isGenerating: false,
  error: null
}

export const useFormStore = create<FormState & FormActions>((set, get) => ({
  ...initialState,

  setPainPoints: (painPoints) => set({ painPoints }),
  
  setIcpDescription: (icpDescription) => set({ icpDescription }),
  
  setSelectedSubreddits: (selectedSubreddits) => set({ selectedSubreddits }),
  
  setGeneratedSubreddits: (generatedSubreddits) => set({ generatedSubreddits }),
  
  setError: (error) => set({ error }),

  resetForm: () => set(initialState),

  initializeFromICP: (icp) => {
    if (!icp) return
    set({
      selectedSubreddits: icp.data?.subreddits || [],
      painPoints: icp.data?.painPoints || '',
      icpDescription: icp.data?.description || ''
    })
  },

  addSubreddit: (subreddit: string) => {
    const { selectedSubreddits } = get()
    const cleanSubreddit = subreddit.replace(/^r\//, '').trim()
    
    if (!cleanSubreddit) return false
    
    const validSubredditRegex = /^[a-zA-Z0-9_]{2,21}$/
    if (!validSubredditRegex.test(cleanSubreddit)) {
      set({ error: 'Subreddit names can only contain letters, numbers, and underscores (2-21 characters)' })
      return false
    }
    
    if (!selectedSubreddits.includes(cleanSubreddit) && selectedSubreddits.length < 5) {
      set({ 
        selectedSubreddits: [...selectedSubreddits, cleanSubreddit],
        error: null
      })
      return true
    } else if (selectedSubreddits.includes(cleanSubreddit)) {
      set({ error: 'This subreddit is already added' })
      return false
    }
    
    return false
  },

  removeSubreddit: (index: number) => {
    const { selectedSubreddits } = get()
    set({
      selectedSubreddits: selectedSubreddits.filter((_, i) => i !== index)
    })
  },

  toggleSubreddit: (subreddit: string) => {
    const { selectedSubreddits } = get()
    
    if (selectedSubreddits.includes(subreddit)) {
      set({
        selectedSubreddits: selectedSubreddits.filter(s => s !== subreddit)
      })
    } else if (selectedSubreddits.length < 5) {
      set({
        selectedSubreddits: [...selectedSubreddits, subreddit]
      })
    }
  },

  analyzeWebsiteUrl: async (url: string) => {
    if (!url.trim()) {
      set({ error: 'Please enter a website URL to analyze' })
      return
    }

    set({ isAnalyzing: true, error: null })
    
    try {
      const result = await analyzeUrl(url)
      set({
        icpDescription: result.icp_description,
        painPoints: result.pain_points
      })
      
      if (result.icp_description.trim() || result.pain_points.trim()) {
        const suggestions = await generateSuggestions(result.icp_description, result.pain_points)
        set({
          generatedSubreddits: suggestions.subreddits,
          selectedSubreddits: suggestions.subreddits.slice(0, 5)
        })
      } else {
    
        set({
          generatedSubreddits: result.subreddits,
          selectedSubreddits: result.subreddits.slice(0, 5)
        })
      }
    } catch (error) {
      set({ error: 'Failed to analyze URL. Please try again or enter details manually.' })
    } finally {
      set({ isAnalyzing: false })
    }
  },

  regenerateSubredditSuggestions: async () => {
    const { icpDescription, painPoints } = get()
    
    if (!icpDescription.trim() && !painPoints.trim()) {
      set({ error: 'Please enter a description or pain points to generate suggestions' })
      return
    }

    set({ isGenerating: true, error: null })
    
    try {
      const result = await generateSuggestions(icpDescription, painPoints)
      set({
        generatedSubreddits: result.subreddits,
        selectedSubreddits: result.subreddits.slice(0, 5)
      })
    } catch (error) {
      set({ error: 'Failed to generate suggestions' })
    } finally {
      set({ isGenerating: false })
    }
  }
}))