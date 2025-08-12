import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { openRouterQueue } from '@/lib/queue'
import { deductTokens, hasEnoughTokens } from '@/lib/tokens'
import { autoSaveContent } from '@/lib/auto-save'
// Portraits handled via /api/portrait-generator

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
    const { name, location, role, mood, customPrompt, skipPortrait = false, campaignContext } = body

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }



    // Build the prompt based on whether custom prompt is used
    let prompt: string
    if (customPrompt) {
      const context = campaignContext || {}
      
      // Build enhanced prompt that incorporates advanced inputs when provided
      let enhancedPrompt = `Create D&D NPC for a campaign with:
- Theme: ${context.theme || 'Adventure'}
- Setting: ${context.setting || 'Fantasy world'}
- Main Plot: ${context.mainPlot || 'Epic adventure'}
- Level Range: ${context.levelRange || '1-10'}

NPC Description: "${customPrompt}"`
      
      // Add advanced inputs if provided
      const advancedInputs = []
      if (name) advancedInputs.push(`named ${name}`)
      if (location) advancedInputs.push(`location: ${location}`)
      if (role) advancedInputs.push(`role: ${role}`)
      if (mood) advancedInputs.push(`mood: ${mood}`)
      
      if (advancedInputs.length > 0) {
        enhancedPrompt += `. Additional specifications: ${advancedInputs.join(', ')}`
      }
      
      prompt = `${enhancedPrompt}

IMPORTANT: This NPC should fit into the campaign's narrative and connect to other elements like locations, quests, and the main plot.

JSON only:
{
  "name": "NPC name",
  "race": "Race",
  "location": "Location",
  "role": "Role",
  "mood": "Mood",
  "backstory": "Brief backstory",
  "personalityTraits": ["trait1", "trait2", "trait3", "trait4"],
  "appearance": "Appearance",
  "motivations": ["motivation1", "motivation2", "motivation3"],
  "relationships": ["relationship1", "relationship2", "relationship3"],
  "secrets": ["secret1", "secret2"],
  "quote": "Quote",
  "uniqueTrait": "Trait",
  "connection": "How this NPC connects to the campaign's story and other elements",
  "stats": {
    "STR": number,
    "DEX": number,
    "CON": number,
    "INT": number,
    "WIS": number,
    "CHA": number
  },
  "skills": ["skill1", "skill2", "skill3"],
  "equipment": ["item1", "item2", "item3"],
  "goals": ["goal1", "goal2", "goal3"]
}`
    } else {
      // Validate required fields
      if (!location || !role || !mood) {
        return NextResponse.json(
          { error: 'Location, role, and mood are required' },
          { status: 400 }
        )
      }

      prompt = `Create D&D NPC: ${location} ${role} ${mood}${name ? ` named ${name}` : ''}. 

JSON only:
{
  "name": "NPC name",
  "race": "Race",
  "location": "${location}",
  "role": "${role}",
  "mood": "${mood}",
  "backstory": "Brief backstory",
  "personalityTraits": ["trait1", "trait2", "trait3", "trait4"],
  "appearance": "Appearance",
  "motivations": ["motivation1", "motivation2", "motivation3"],
  "relationships": ["relationship1", "relationship2", "relationship3"],
  "secrets": ["secret1", "secret2"],
  "quote": "Quote",
  "uniqueTrait": "Trait",
  "stats": {
    "STR": number,
    "DEX": number,
    "CON": number,
    "INT": number,
    "WIS": number,
    "CHA": number
  },
  "skills": ["skill1", "skill2", "skill3"],
  "equipment": ["item1", "item2", "item3"],
  "goals": ["goal1", "goal2", "goal3"]
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
              content: 'D&D NPC expert. JSON only, no explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
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
    let npc
    try {
      // First, try to parse the entire content directly
      try {
        npc = JSON.parse(content.trim())
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
            { error: 'Failed to parse NPC data from AI response' },
            { status: 500 }
          )
        }

        // Try to parse the extracted JSON
        const jsonString = jsonMatch[1] || jsonMatch[0]
        try {
          npc = JSON.parse(jsonString)
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
            npc = JSON.parse(fixedJson)
          } catch (secondError) {
            console.error('Second JSON parse error:', secondError)
            console.error('Attempted to parse:', fixedJson)
            return NextResponse.json(
              { error: 'Failed to parse NPC data. Please try again.' },
              { status: 500 }
            )
          }
        }
      }
    } catch (error) {
      console.error('JSON extraction error:', error)
      return NextResponse.json(
        { error: 'Failed to extract NPC data from AI response' },
        { status: 500 }
      )
    }

    // Validate and enhance the NPC data
    const normalizeArray = (value: unknown): string[] => Array.isArray(value) ? value : (value == null ? [] : [String(value)])
    const ensureString = (value: unknown, fallback: string = ''): string => (value == null ? fallback : String(value))

    const enhancedNPC = {
      ...npc,
      race: ensureString(npc.race, 'Human'),
      stats: npc.stats || {
        STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10
      },
      backstory: ensureString(npc.backstory || npc.background),
      skills: normalizeArray(npc.skills).length ? normalizeArray(npc.skills) : ['Common'],
      equipment: normalizeArray(npc.equipment).length ? normalizeArray(npc.equipment) : ['Basic clothing'],
      goals: normalizeArray(npc.goals).length ? normalizeArray(npc.goals) : ['Survive'],
      personality: ensureString(npc.personality || (npc as Record<string, unknown>).personalityTraits),
      appearance: Array.isArray(npc.appearance) ? npc.appearance.join(', ') : (npc.appearance || ''),
      mood: ensureString(npc.mood),
      motivations: normalizeArray(npc.motivations),
      relationships: normalizeArray(npc.relationships),
      secrets: normalizeArray(npc.secrets),
    }

    // Deduct tokens after successful NPC generation
    const tokensUsed = await deductTokens(payload.userId, 1)
    if (!tokensUsed) {
      return NextResponse.json(
        { error: 'Failed to deduct tokens. Please try again.' },
        { status: 500 }
      )
    }

    // Auto-save the generated NPC (without portrait for now)
    const npcData = {
      ...enhancedNPC,
      portrait: null // Will be updated later if portrait generation succeeds
    }
    
    try {
      const savedNPC = await autoSaveContent({
        type: 'npc',
        data: npcData,
        userId: payload.userId
      })
      console.log('NPC auto-saved successfully')
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      // Don't fail the generation if auto-save fails
    }

    // Return NPC data immediately
    console.log('NPC generated successfully - returning data immediately')
    return NextResponse.json({ 
      npc: npcData,
      portraitPending: !skipPortrait
    })
  } catch (error) {
    console.error('NPC generation error:', error)
    
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
      { error: 'Failed to generate NPC. Please try again.' },
      { status: 500 }
    )
  }
} 