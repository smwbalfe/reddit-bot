export type PostWithConfigId = {
  id: number
  configId: number
  subreddit: string
  title: string
  content: string
  url: string
  leadQuality?: number | null
  leadStatus: 'new' | 'seen' | 'responded'
  analysisData: {
    painPoints?: string
    productFitScore?: number
    intentSignalsScore?: number
    urgencyIndicatorsScore?: number
    decisionAuthorityScore?: number
    engagementQualityScore?: number
    productFitJustification?: string
    intentSignalsJustification?: string
    urgencyIndicatorsJustification?: string
    decisionAuthorityJustification?: string
    engagementQualityJustification?: string
  } | null
  overallAssessment?: string | null
  redditCreatedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export type EmailData = {
  email: string
  name: string
  userId: string
}

export type CheckoutRequestBody = {
  userId: string
  email: string
  name?: string
  line_item: {
    price: string
    quantity: number
  }
}