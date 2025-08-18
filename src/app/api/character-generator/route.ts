import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { openRouterQueue } from '@/lib/queue'
import { deductTokens, hasEnoughTokens } from '@/lib/tokens'
import { saveContentSingleInstance } from '@/lib/content-manager'
import { cleanAIResponse, normalizeData } from '@/lib/ai-response-cleaner'

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

    // Use the queue system for OpenRouter API calls with priority
    const response = await openRouterQueue.add(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000) // Increased to 45 second timeout
      
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
          stream: false
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
    const finishReason = data?.choices?.[0]?.finish_reason
    if (finishReason === 'length') {
      console.warn('Response was truncated due to token limit')
    }
    
    // OpenRouter returns content in content field
    const rawContent = data?.choices?.[0]?.message?.content
    const content = (() => {
      if (typeof rawContent === 'string') return rawContent
      if (Array.isArray(rawContent)) {
        // Some models return content as an array of parts
        return rawContent
          .map((part: any) => {
            if (typeof part === 'string') return part
            if (part && typeof part.text === 'string') return part.text
            if (part && typeof part.content === 'string') return part.content
            return ''
          })
          .join('')
      }
      if (rawContent && typeof rawContent === 'object') {
        if (typeof (rawContent as any).text === 'string') return (rawContent as any).text
        if (typeof (rawContent as any).content === 'string') return (rawContent as any).content
      }
      return ''
    })()

    // Clean and parse the AI response using improved utility
    let character
    try {
      const cleaned = cleanAIResponse(content)
      character = normalizeData(cleaned.data)
      
      if (cleaned.wasFixed) {
        console.log('AI response required cleaning, but was successfully parsed')
      }
      
      if (cleaned.errors.length > 0) {
        console.warn('AI response cleaning warnings:', cleaned.errors)
      }
    } catch (cleaningError) {
      console.error('AI response cleaning failed:', cleaningError)
      // Fallback to original parsing logic
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
          if (finishReason === 'length') {
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
    }

    // Validate and enhance the character data
    const normalizeStringArray = (val: any) => {
      if (Array.isArray(val)) return val.map((v) => String(v))
      if (typeof val === 'string') {
        return val
          .split(/[\n,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      }
      return []
    }

    const safeStats = {
      STR: Number.isFinite(character?.stats?.STR) ? character.stats.STR : 10,
      DEX: Number.isFinite(character?.stats?.DEX) ? character.stats.DEX : 10,
      CON: Number.isFinite(character?.stats?.CON) ? character.stats.CON : 10,
      INT: Number.isFinite(character?.stats?.INT) ? character.stats.INT : 10,
      WIS: Number.isFinite(character?.stats?.WIS) ? character.stats.WIS : 10,
      CHA: Number.isFinite(character?.stats?.CHA) ? character.stats.CHA : 10,
    }

    const enhancedCharacter = {
      ...character,
      stats: safeStats,
      personalityTraits: normalizeStringArray(character?.personalityTraits),
      level: Number.isFinite(character?.level) ? character.level : 1,
      hitPoints: Number.isFinite(character?.hitPoints)
        ? character.hitPoints
        : safeStats.CON * 2 + 10,
      armorClass: Number.isFinite(character?.armorClass) ? character.armorClass : 10,
      initiative: Number.isFinite(character?.initiative)
        ? character.initiative
        : Math.floor((safeStats.DEX - 10) / 2),
      speed: Number.isFinite(character?.speed) ? character.speed : 30,
      proficiencies: normalizeStringArray(character?.proficiencies).length
        ? normalizeStringArray(character?.proficiencies)
        : ['Common'],
      features: normalizeStringArray(character?.features).length
        ? normalizeStringArray(character?.features)
        : ['Class Feature 1', 'Class Feature 2'],
    }

    // Deduct tokens after successful character generation
    const tokensUsed = await deductTokens(payload.userId, 1)
    if (!tokensUsed) {
      return NextResponse.json(
        { error: 'Failed to deduct tokens. Please try again.' },
        { status: 500 }
      )
    }

    // Auto-save the generated character using single-instance manager
    const characterData = {
      ...enhancedCharacter,
      portrait: null // Will be updated later if portrait generation succeeds
    }
    
    try {
      const saveResult = await saveContentSingleInstance({
        type: 'character',
        data: characterData,
        userId: payload.userId
      })
      console.log('Character auto-saved successfully:', saveResult)
      
      // Add the saved ID to the character data for frontend tracking
      characterData.id = saveResult.id
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      // Don't fail the generation if auto-save fails
    }

    // Return character data immediately with save info
    console.log('Character generated successfully - returning data immediately')
    return NextResponse.json({ 
      character: characterData,
      portraitPending: !skipPortrait,
      savedId: characterData.id
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