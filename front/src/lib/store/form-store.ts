import { create } from 'zustand'
import { FormState, FormActions } from '@/src/lib/store/types'
import { generateSuggestions } from '../actions/content/generate-suggestions'
import { analyzeUrl } from '../actions/content/analyze-url'
import { validateSubreddit } from '../actions/content/validate-subreddit'

const initialState: FormState = {
  generatedSubreddits: [],
  selectedSubreddits: [],
  painPoints: '',
  icpDescription: '',
  isAnalyzing: false,
  isGenerating: false,
  isValidatingSubreddit: false,
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
    const cleanedSubreddits = (icp.data?.subreddits || []).map((s: string) => s.replace(/^r\//, '').trim()).filter((s: string) => s)
    set({
      selectedSubreddits: cleanedSubreddits,
      painPoints: icp.data?.painPoints || '',
      icpDescription: icp.data?.description || ''
    })
  },

  addSubreddit: async (subreddit: string) => {
    const { selectedSubreddits } = get()
    const cleanSubreddit = subreddit.replace(/^r\//, '').trim()
    
    if (!cleanSubreddit) return false
    
    const validSubredditRegex = /^[a-zA-Z0-9_]{2,21}$/
    if (!validSubredditRegex.test(cleanSubreddit)) {
      set({ error: 'Subreddit names can only contain letters, numbers, and underscores (2-21 characters)' })
      return false
    }
    
    if (selectedSubreddits.includes(cleanSubreddit)) {
      set({ error: 'This subreddit is already added' })
      return false
    }

    if (selectedSubreddits.length >= 5) {
      set({ error: 'Maximum of 5 subreddits allowed' })
      return false
    }
    
    set({ isValidatingSubreddit: true, error: null })
    
    try {
      const validation = await validateSubreddit(cleanSubreddit)
      if (!validation.is_valid) {
        set({ error: validation.error_message || 'Invalid subreddit name', isValidatingSubreddit: false })
        return false
      }
      
      set({ 
        selectedSubreddits: [...selectedSubreddits, cleanSubreddit],
        error: null,
        isValidatingSubreddit: false
      })
      return true
    } catch (error) {
      set({ error: 'Failed to validate subreddit', isValidatingSubreddit: false })
      return false
    }
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
        const cleanedGeneratedSubreddits = suggestions.subreddits.map((s: string) => s.replace(/^r\//, '').trim()).filter((s: string) => s)
        set({
          generatedSubreddits: cleanedGeneratedSubreddits,
          selectedSubreddits: cleanedGeneratedSubreddits.slice(0, 5)
        })
      } else {
        const cleanedSubreddits = result.subreddits.map((s: string) => s.replace(/^r\//, '').trim()).filter((s: string) => s)
        set({
          generatedSubreddits: cleanedSubreddits,
          selectedSubreddits: cleanedSubreddits.slice(0, 5)
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
      const cleanedSubreddits = result.subreddits.map((s: string) => s.replace(/^r\//, '').trim()).filter((s: string) => s)
      set({
        generatedSubreddits: cleanedSubreddits,
        selectedSubreddits: cleanedSubreddits.slice(0, 5)
      })
    } catch (error) {
      set({ error: 'Failed to generate suggestions' })
    } finally {
      set({ isGenerating: false })
    }
  }
}))