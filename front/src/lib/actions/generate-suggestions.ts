'use server'
import env from '@/src/lib/env'

export interface GenerateSuggestionsRequest {
  description: string
  pain_points: string
  keyword_count?: number
  use_alternative_subreddit_gen?: boolean
}

export interface GenerateSuggestionsResponse {
  keywords: string[]
  subreddits: string[]
}

export async function generateSuggestions(description: string, painPoints: string, keywordCount: number = 20): Promise<GenerateSuggestionsResponse> {
  try {
    const response = await fetch(`${env.FASTAPI_SERVER_URL}/api/generate-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: description,
        pain_points: painPoints,
        keyword_count: keywordCount
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      keywords: data.keywords,
      subreddits: data.subreddits
    };
  } catch (error) {
    throw new Error('Failed to generate suggestions');
  }
}