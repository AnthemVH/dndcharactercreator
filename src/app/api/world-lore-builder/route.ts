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
    const { name, theme, landName, climate, customPrompt, campaignContext } = body

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    // Build the prompt based on whether custom prompt is used
    let prompt: string
    if (customPrompt) {
      const context = campaignContext || {}
      
      // Build enhanced prompt that incorporates advanced inputs when provided
      let enhancedPrompt = `Create a detailed D&D 5e world/locations for a campaign with:
- Theme: ${context.theme || 'Adventure'}
- Setting: ${context.setting || 'Fantasy world'}
- Main Plot: ${context.mainPlot || 'Epic adventure'}
- Level Range: ${context.levelRange || '1-10'}

World/Location Description: "${customPrompt}"`
      
      // Add advanced inputs if provided
      const advancedInputs = []
      if (name) advancedInputs.push(`named ${name}`)
      if (theme) advancedInputs.push(`theme: ${theme}`)
      if (landName) advancedInputs.push(`land: ${landName}`)
      if (climate) advancedInputs.push(`climate: ${climate}`)
      
      if (advancedInputs.length > 0) {
        enhancedPrompt += `. Additional specifications: ${advancedInputs.join(', ')}`
      }
      
      prompt = `${enhancedPrompt}

IMPORTANT: These locations should fit into the campaign's narrative and connect to other elements like NPCs, quests, and the main plot.

IMPORTANT: Respond with ONLY valid JSON objects, no markdown, no code blocks, no explanatory text. Keep all descriptions concise.

Generate locations with this EXACT JSON structure:
{
  "name": "World/Location name",
  "theme": "World/Location theme", 
  "landName": "Land name",
  "geography": "Concise geography description (1-2 sentences)",
  "politics": "Political system and government (1-2 sentences)",
  "culture": "Cultural aspects and society (1-2 sentences)",
  "notableEvents": ["event1", "event2", "event3"],
  "majorFactions": ["faction1", "faction2", "faction3"],
  "landmarks": ["landmark1", "landmark2", "landmark3"],
  "climate": "Climate description",
  "resources": ["resource1", "resource2", "resource3"],
  "population": "Population description",
  "government": "Government type",
  "religion": "Religious beliefs",
  "economy": "Economic system",
  "conflicts": ["conflict1", "conflict2", "conflict3"],
  "legends": ["legend1", "legend2", "legend3"],
  "quote": "A memorable quote about the world",
  "uniqueFeature": "One unique feature of this world",
  "history": "Historical background (1-2 sentences)"
}

Make the world rich and detailed with interconnected elements. Keep all descriptions concise and focused. Include interesting conflicts, legends, and unique features that make this world memorable and relevant to the campaign.`
    } else {
      // Validate required fields
      if (!theme || !landName) {
        return NextResponse.json(
          { error: 'Theme and land name are required' },
          { status: 400 }
        )
      }

      prompt = `Create a detailed D&D 5e world with the following specifications:
- Theme: ${theme}
- Land Name: ${landName}
${name ? `- Name: ${name}` : ''}
${climate ? `- Climate: ${climate}` : ''}

IMPORTANT: Respond with ONLY valid JSON objects, no markdown, no code blocks, no explanatory text. Keep all descriptions concise.

Generate a complete world with this EXACT JSON structure:
{
  "name": "World name",
  "theme": "${theme}",
  "landName": "${landName}",
  "geography": "Concise geography description (1-2 sentences)",
  "politics": "Political system and government (1-2 sentences)",
  "culture": "Cultural aspects and society (1-2 sentences)",
  "notableEvents": ["event1", "event2", "event3"],
  "majorFactions": ["faction1", "faction2", "faction3"],
  "landmarks": ["landmark1", "landmark2", "landmark3"],
  "climate": "Climate description",
  "resources": ["resource1", "resource2", "resource3"],
  "population": "Population description",
  "government": "Government type",
  "religion": "Religious beliefs",
  "economy": "Economic system",
  "conflicts": ["conflict1", "conflict2", "conflict3"],
  "legends": ["legend1", "legend2", "legend3"],
  "quote": "A memorable quote about the world",
  "uniqueFeature": "One unique feature of this world",
  "history": "Historical background (1-2 sentences)"
}

Make the world rich and detailed with interconnected elements. Keep all descriptions concise and focused. Include interesting conflicts, legends, and unique features that make this world memorable.`
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
              content: 'You are a D&D 5e world-building expert. You must respond with ONLY valid JSON objects, no other text or explanations. Always format your response as a complete JSON object. Keep all descriptions concise and focused.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
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
    let world
    try {
      // First, try to parse the entire content directly
      try {
        world = JSON.parse(content.trim())
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
            { error: 'Failed to parse world data from AI response' },
            { status: 500 }
          )
        }

        // Try to parse the extracted JSON
        const jsonString = jsonMatch[1] || jsonMatch[0]
        try {
          world = JSON.parse(jsonString)
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
            world = JSON.parse(fixedJson)
          } catch (secondError) {
            console.error('Second JSON parse error:', secondError)
            console.error('Attempted to parse:', fixedJson)
            return NextResponse.json(
              { error: 'Failed to parse world data. Please try again.' },
              { status: 500 }
            )
          }
        }
      }
    } catch (error) {
      console.error('JSON extraction error:', error)
      return NextResponse.json(
        { error: 'Failed to extract world data from AI response' },
        { status: 500 }
      )
    }

    // Validate and enhance the world data
    const enhancedWorld = {
      ...world,
      name: world.name || 'Unknown World',
      theme: world.theme || 'Fantasy',
      landName: world.landName || 'Unknown Land',
      geography: world.geography || 'A mysterious land with diverse terrain.',
      politics: world.politics || 'A complex political system governs this realm.',
      culture: world.culture || 'Rich cultural traditions shape the society.',
      climate: world.climate || 'Temperate climate with seasonal changes.',
      population: world.population || 'A diverse population of various races.',
      government: world.government || 'Monarchy with noble houses.',
      religion: world.religion || 'Polytheistic beliefs with multiple deities.',
      economy: world.economy || 'Mixed economy with trade and agriculture.',
      quote: world.quote || 'A world of endless possibilities.',
      uniqueFeature: world.uniqueFeature || 'Mystical energy flows through the land.',
      history: world.history || 'Ancient civilizations have shaped this world.',
      notableEvents: world.notableEvents || ['Ancient founding'],
      majorFactions: world.majorFactions || ['Local government'],
      landmarks: world.landmarks || ['Central plaza'],
      resources: world.resources || ['Basic materials'],
      conflicts: world.conflicts || ['Minor disputes'],
      legends: world.legends || ['Local myths'],
    }

    // Deduct tokens after successful generation
    const tokensUsed = await deductTokens(payload.userId, 1)
    if (!tokensUsed) {
      return NextResponse.json(
        { error: 'Failed to deduct tokens. Please try again.' },
        { status: 500 }
      )
    }

    // Auto-save the generated world
    try {
      await autoSaveContent({
        type: 'world',
        data: enhancedWorld,
        userId: payload.userId
      })
      console.log('World auto-saved successfully')
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      // Don't fail the generation if auto-save fails
    }

    console.log('World generated successfully using OpenRouter queue')
    return NextResponse.json({ world: enhancedWorld })
  } catch (error) {
    console.error('World generation error:', error)
    
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
      { error: 'Failed to generate world. Please try again.' },
      { status: 500 }
    )
  }
} 