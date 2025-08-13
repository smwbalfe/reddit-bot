import { ICP } from '@/src/lib/db/schema'

export interface ICPState {
  icps: ICP[]
  isLoading: boolean
  isDeleting: number | null
  isGenerating: number | null
  isAnalyzingUrl: number | null

  generatedSubreddits: Record<number, string[]>
  selectedSubreddits: Record<number, string[]>
  error: string | null
}

export interface ICPActions {
  fetchICPs: () => Promise<void>
  createICP: (formData: FormData) => Promise<boolean>
  updateICP: (id: number, formData: FormData, skipRefetch?: boolean) => Promise<boolean>
  deleteICP: (id: number) => Promise<boolean>
  analyzeWebsite: (icpId: number) => Promise<void>
  regenerateSuggestions: (icpId: number) => Promise<void>

  updateSelectedSubreddits: (icpId: number, subreddits: string[]) => void
  setGeneratedSubreddits: (icpId: number, subreddits: string[]) => void
  setError: (error: string | null) => void
}

export interface CreateIcpFormProps {
  onSuccess?: () => void
  editingIcp?: ICP | null
}
