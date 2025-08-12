import { NextRequest, NextResponse } from 'next/server'
import { hasEnoughTokens } from '@/lib/tokens'
import { openRouterQueue } from '@/lib/queue'

const STABLEHORDE_API_KEY = process.env.STABLEHORDE_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user has enough tokens
    const hasTokens = await hasEnoughTokens(userId)
    if (!hasTokens) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please purchase more tokens to continue.' },
        { status: 402 }
      )
    }

    // Use the queue system for StableHorde API calls
    const response = await openRouterQueue.add(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout for image generation
      
      const apiResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STABLEHORDE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
        }),
      })

      clearTimeout(timeoutId)

      if (!apiResponse.ok) {
        let errorData
        try {
          errorData = await apiResponse.json()
        } catch (e) {
          errorData = await apiResponse.text()
        }
        console.error('Stability AI API error:', errorData)
        
        if (apiResponse.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.')
        }
        
        throw new Error(errorData.error || `HTTP ${apiResponse.status}`)
      }

      return await apiResponse.json()
    })

    // Extract the image data
    const imageData = response.artifacts?.[0]
    if (!imageData) {
      throw new Error('No image generated')
    }

    // Convert base64 to data URL
    const imageUrl = `data:image/png;base64,${imageData.base64}`

    return NextResponse.json({
      imageUrl,
      portrait: imageUrl, // For compatibility with existing code
    })

  } catch (error) {
    console.error('Portrait generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Portrait generation failed' },
      { status: 500 }
    )
  }
}
