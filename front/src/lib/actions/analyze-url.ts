'use server'

export interface AnalyzeUrlResponse {
  keywords: string[]
  subreddits: string[]
  icp_description: string
}

export async function analyzeUrl(url: string, keywordCount: number = 15, subredditCount: number = 20): Promise<AnalyzeUrlResponse> {
  console.log(`[analyzeUrl] Called with url=${url}, keywordCount=${keywordCount}, subredditCount=${subredditCount}`)
  try {
    const response = await fetch('http://localhost:8000/api/analyze-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        keyword_count: keywordCount,
        subreddit_count: subredditCount
      }),
    });

    console.log(`[analyzeUrl] Response status: ${response.status}`)

    if (!response.ok) {
      console.error(`[analyzeUrl] HTTP error! status: ${response.status}`)
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[analyzeUrl] Received data:`, data)
    return {
      keywords: data.keywords,
      subreddits: data.subreddits,
      icp_description: data.icp_description
    };
  } catch (error) {
    console.error('[analyzeUrl] Error analyzing URL:', error);
    throw new Error('Failed to analyze URL');
  }
}