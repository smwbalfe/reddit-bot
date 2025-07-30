'use server'

export async function generateKeywords(prompt: string): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:8000/api/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        count: 30
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.keywords;
  } catch (error) {
    console.error('Error generating keywords:', error);
    throw new Error('Failed to generate keywords');
  }
}

export async function generateKeywordsFromUrl(url: string): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:8000/api/keywords/from-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        count: 30
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.keywords;
  } catch (error) {
    console.error('Error generating keywords from URL:', error);
    throw new Error('Failed to generate keywords from URL');
  }
}