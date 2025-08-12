import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { openRouterQueue } from '@/lib/queue'
import { generatePortraitPrompt } from '@/lib/image-storage'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { characterData, contentType = 'character' } = body

    console.log('Portrait generator received request:', {
      contentType,
      characterName: characterData?.name,
      hasCharacterData: !!characterData
    })

    if (!characterData) {
      return NextResponse.json({ error: 'Character data is required' }, { status: 400 })
    }

    // Generate portrait for the character
    try {
      const portraitPrompt = generatePortraitPrompt(contentType, characterData)

      const portraitResponse = await openRouterQueue.add(async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // Longer timeout for StableHorde
        
        const apiResponse = await fetch('https://stablehorde.net/api/v2/generate/async', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.STABLEHORDE_API_KEY || '0000000000', // Anonymous key if not provided
            'Client-Agent': 'DNDApp:1.0.0'
          },
          signal: controller.signal,
          body: JSON.stringify({
            prompt: portraitPrompt,
            params: {
              width: 512,
              height: 512,
              steps: 20,
              cfg_scale: 7
            },
            nsfw: false,
            trusted_workers: false,
            models: ['stable_diffusion']
          }),
        })

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text()
          console.error('StableHorde API error response:', errorText)
          throw new Error(`Portrait generation failed: ${apiResponse.status} - ${errorText}`)
        }

        clearTimeout(timeoutId)
        return apiResponse
      }, payload.userId)

      const portraitData = await portraitResponse.json()
      const generationId = portraitData.id
      
      // Poll for completion
      let attempts = 0
      const maxAttempts = 120 // 10 minutes with 5-second intervals
      let imageUrl = null
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        
        try {
          const statusResponse = await fetch(`https://stablehorde.net/api/v2/generate/status/${generationId}`, {
            headers: {
              'apikey': process.env.STABLEHORDE_API_KEY || '0000000000',
              'Client-Agent': 'DNDApp:1.0.0'
            }
          })
          
          if (!statusResponse.ok) {
            console.log(`Status check failed: ${statusResponse.status}, attempt ${attempts + 1}`)
            attempts++
            continue
          }
          
          const statusData = await statusResponse.json()
          
          if (statusData.done) {
            if (statusData.generations && statusData.generations.length > 0) {
              imageUrl = statusData.generations[0].img
              console.log('Image generation completed successfully')
              break
            } else {
              throw new Error('No image generated')
            }
          }
          
          // Log progress every 10 attempts
          if (attempts % 10 === 0) {
            console.log(`Image generation in progress... attempt ${attempts + 1}/${maxAttempts}`)
          }
          
          attempts++
        } catch (statusError) {
          console.error('Status check error:', statusError)
          attempts++
          continue
        }
      }
      
      if (!imageUrl) {
        throw new Error('Image generation timed out after 10 minutes')
      }
      
      // Save image locally for persistent storage
      try {
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch generated image')
        }
        
        const imageBuffer = await imageResponse.arrayBuffer()
        const imageId = uuidv4()
        const fileName = `${imageId}.webp`
        
        // Ensure portraits directory exists
        const portraitsDir = join(process.cwd(), 'public', 'portraits')
        await mkdir(portraitsDir, { recursive: true })
        
        // Save image to public/portraits directory
        const imagePath = join(portraitsDir, fileName)
        await writeFile(imagePath, Buffer.from(imageBuffer))
        
        // Return stable URL
        const stableUrl = `/portraits/${fileName}`
        
        console.log('Portrait saved locally:', stableUrl)
        console.log('Returning portrait data:', { portrait: stableUrl, success: true })
        return NextResponse.json({ 
          portrait: stableUrl,
          success: true
        })
      } catch (saveError) {
        console.error('Failed to save image locally:', saveError)
        // Fallback to original URL if local save fails
        console.log('Using fallback URL:', imageUrl)
        return NextResponse.json({ 
          portrait: imageUrl,
          success: true
        })
      }
      
    } catch (portraitError) {
      console.error('Portrait generation error:', portraitError)
      return NextResponse.json(
        { error: 'Failed to generate portrait. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Portrait generation error:', error)
    
    // Handle rate limiting specifically
    if (error instanceof Error && error.message && error.message.includes('429')) {
      return NextResponse.json(
        { error: 'AI service is currently busy. Please wait a moment and try again.' },
        { status: 429 }
      )
    }
    
    // Handle timeout errors
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
      return NextResponse.json(
        { error: 'AI request timed out. Please try again.' },
        { status: 408 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate portrait. Please try again.' },
      { status: 500 }
    )
  }
} 