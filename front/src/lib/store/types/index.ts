export interface FormState {
  generatedSubreddits: string[]
  selectedSubreddits: string[]
  painPoints: string
  icpDescription: string
  isAnalyzing: boolean
  isGenerating: boolean
  isValidatingSubreddit: boolean
  error: string | null
}

export interface FormActions {
  setPainPoints: (painPoints: string) => void
  setIcpDescription: (description: string) => void
  setSelectedSubreddits: (subreddits: string[]) => void
  setGeneratedSubreddits: (subreddits: string[]) => void
  addSubreddit: (subreddit: string) => Promise<boolean>
  removeSubreddit: (index: number) => void
  toggleSubreddit: (subreddit: string) => void
  analyzeWebsiteUrl: (url: string) => Promise<void>
  regenerateSubredditSuggestions: () => Promise<void>
  setError: (error: string | null) => void
  resetForm: () => void
  initializeFromICP: (icp: any) => void
}