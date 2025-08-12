import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { openRouterQueue } from '@/lib/queue'
import { deductTokens, hasEnoughTokens } from '@/lib/tokens'
import { autoSaveContent } from '@/lib/auto-save'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

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
    const { name, race, class: characterClass, background, personalityType, customPrompt, skipPortrait = false } = body

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    // Build the prompt based on whether custom prompt is used
    let prompt: string
    if (customPrompt) {
      // Build enhanced prompt that incorporates advanced inputs when provided
      let enhancedPrompt = `Create D&D character: "${customPrompt}"`
      
      // Add advanced inputs if provided
      const advancedInputs = []
      if (name) advancedInputs.push(`named ${name}`)
      if (race) advancedInputs.push(`race: ${race}`)
      if (characterClass) advancedInputs.push(`class: ${characterClass}`)
      if (background) advancedInputs.push(`background: ${background}`)
      if (personalityType) advancedInputs.push(`personality: ${personalityType}`)
      
      if (advancedInputs.length > 0) {
        enhancedPrompt += `. Additional specifications: ${advancedInputs.join(', ')}`
      }
      
      prompt = `${enhancedPrompt}

JSON only:
{
  "name": "name",
  "race": "race", 
  "class": "class",
  "background": "background",
  "backstory": "brief backstory",
  "personalityTraits": ["trait1", "trait2", "trait3", "trait4"],
  "stats": {"STR": 14, "DEX": 12, "CON": 13, "INT": 10, "WIS": 11, "CHA": 9},
  "quote": "quote",
  "uniqueTrait": "trait",
  "level": 1,
  "hitPoints": 12,
  "armorClass": 14,
  "initiative": 1,
  "speed": 30,
  "proficiencies": ["Common", "prof2", "prof3"],
  "features": ["feature1", "feature2"]
}`
    } else {
      // Validate required fields
      if (!race || !characterClass || !background) {
        return NextResponse.json(
          { error: 'Race, class, and background are required' },
          { status: 400 }
        )
      }

      prompt = `Create D&D character: ${race} ${characterClass} ${background}${name ? ` named ${name}` : ''}${personalityType ? `, ${personalityType}` : ''}. 

JSON only:
{
  "name": "name",
  "race": "${race}",
  "class": "${characterClass}",
  "background": "${background}",
  "backstory": "brief backstory",
  "personalityTraits": ["trait1", "trait2", "trait3", "trait4"],
  "stats": {"STR": 14, "DEX": 12, "CON": 13, "INT": 10, "WIS": 11, "CHA": 9},
  "quote": "quote",
  "uniqueTrait": "trait",
  "level": 1,
  "hitPoints": 12,
  "armorClass": 14,
  "initiative": 1,
  "speed": 30,
  "proficiencies": ["Common", "prof2", "prof3"],
  "features": ["feature1", "feature2"]
}`
    }

    // Check if user has enough tokens
    const hasTokens = await hasEnoughTokens(payload.userId)
    if (!hasTokens) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please purchase more tokens to continue.' },
        { status: 402 }
      )
    }

    // Use the queue system for OpenRouter API calls
    const response = await openRouterQueue.add(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // Reduced to 30 second timeout
      
      const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          'X-Title': 'DND App'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'z-ai/glm-4.5-air:free',
          messages: [
            {
              role: 'system',
              content: 'D&D character expert. JSON only, no explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      })

      if (!apiResponse.ok) {
        let errorData
        try {
          errorData = await apiResponse.json()
        } catch (e) {
          errorData = await apiResponse.text()
        }
        console.error('OpenRouter API error:', errorData)
        
        // Handle rate limiting specifically
        if (apiResponse.status === 429) {
          throw new Error(`429: Rate limited - ${JSON.stringify(errorData)}`)
        }
        
        throw new Error(`OpenRouter API failed: ${apiResponse.status} - ${JSON.stringify(errorData)}`)
      }

      clearTimeout(timeoutId)
      return apiResponse
    }, payload.userId)

    const data = await response.json()
    console.log('OpenRouter response:', JSON.stringify(data, null, 2))
    
    // Check if response was truncated
    if (data.choices[0].finish_reason === 'length') {
      console.warn('Response was truncated due to token limit')
    }
    
    // OpenRouter returns content in content field
    const content = data.choices[0].message.content || ''

    // Extract JSON from the response with better error handling
    let character
    try {
      // First, try to parse the entire content directly
      try {
        character = JSON.parse(content.trim())
      } catch (directParseError) {
        // If direct parsing fails, try to extract JSON from markdown code blocks
        let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
        if (!jsonMatch) {
          // Try without the json language specifier
          jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/)
        }
        if (!jsonMatch) {
          // Try to find any JSON object
          jsonMatch = content.match(/\{[\s\S]*\}/)
        }
        
        if (!jsonMatch) {
          console.error('No JSON found in content:', content)
          return NextResponse.json(
            { error: 'Failed to parse character data from AI response' },
            { status: 500 }
          )
        }

        // Try to parse the extracted JSON
        const jsonString = jsonMatch[1] || jsonMatch[0]
        try {
          character = JSON.parse(jsonString)
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          console.error('JSON string:', jsonString)
          
          // Try to fix common truncation issues
          let fixedJson = jsonString.replace(/,\s*$/, '') // Remove trailing comma
          
          // If response was truncated, try to complete the JSON structure
          if (data.choices[0].finish_reason === 'length') {
            // Try to find the last complete object and close it
            const lastBraceIndex = fixedJson.lastIndexOf('}')
            if (lastBraceIndex > 0) {
              fixedJson = fixedJson.substring(0, lastBraceIndex + 1)
            }
          }
          
          try {
            character = JSON.parse(fixedJson)
          } catch (secondError) {
            console.error('Second JSON parse error:', secondError)
            console.error('Attempted to parse:', fixedJson)
            return NextResponse.json(
              { error: 'Failed to parse character data. Please try again.' },
              { status: 500 }
            )
          }
        }
      }
    } catch (error) {
      console.error('JSON extraction error:', error)
      return NextResponse.json(
        { error: 'Failed to extract character data from AI response' },
        { status: 500 }
      )
    }

    // Validate and enhance the character data
    const enhancedCharacter = {
      ...character,
      level: character.level || 1,
      hitPoints: character.hitPoints || (character.stats.CON * 2 + 10),
      armorClass: character.armorClass || 10,
      initiative: character.initiative || Math.floor((character.stats.DEX - 10) / 2),
      speed: character.speed || 30,
      proficiencies: character.proficiencies || ['Common'],
      features: character.features || ['Class Feature 1', 'Class Feature 2'],
    }

    // Deduct tokens after successful character generation
    const tokensUsed = await deductTokens(payload.userId, 1)
    if (!tokensUsed) {
      return NextResponse.json(
        { error: 'Failed to deduct tokens. Please try again.' },
        { status: 500 }
      )
    }

    // Auto-save the generated character (without portrait for now)
    const characterData = {
      ...enhancedCharacter,
      portrait: null // Will be updated later if portrait generation succeeds
    }
    
    try {
      const savedCharacter = await autoSaveContent({
        type: 'character',
        data: characterData,
        userId: payload.userId
      })
      console.log('Character auto-saved successfully')
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      // Don't fail the generation if auto-save fails
    }

    // Return character data immediately
    console.log('Character generated successfully - returning data immediately')
    return NextResponse.json({ 
      character: characterData,
      portraitPending: !skipPortrait
    })
  } catch (error) {
    console.error('Character generation error:', error)
    
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
        { error: 'AI request timed out. Please try again with a simpler prompt.' },
        { status: 408 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate character. Please try again.' },
      { status: 500 }
    )
  }
} 