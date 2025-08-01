'use server'
import env from '@/src/lib/env'

export async function findRelevantSubreddits(description: string): Promise<string[]> {
  try {
    const response = await fetch(`${env.FASTAPI_SERVER_URL}/api/subreddits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: description,
        count: 20
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.subreddits;
  } catch (error) {
    console.error('Error finding subreddits:', error);
    throw new Error('Failed to find relevant subreddits');
  }
}