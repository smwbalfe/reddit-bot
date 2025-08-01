import { NextRequest, NextResponse } from 'next/server'
import { makeServerClient } from '@/src/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await makeServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postId, postTitle, postContent, subreddit, productName, productDescription, productWebsite } = body

    if (!postTitle || !postContent || !productName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Call the FastAPI backend agent endpoint
    const agentResponse = await fetch(`http://localhost:8000/generate-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_title: postTitle,
        post_content: postContent,
        subreddit: subreddit,
        product_name: productName,
        product_description: productDescription,
        product_website: productWebsite,
      }),
    })

    if (!agentResponse.ok) {
      throw new Error(`Agent API error: ${agentResponse.status}`)
    }

    const agentData = await agentResponse.json()
    
    return NextResponse.json({ reply: agentData.reply })
  } catch (error) {
    console.error('Error generating reply:', error)
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    )
  }
}