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
    const { name, partyLevel, theme, setting, difficulty, duration, customPrompt, campaignContext } = body

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
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
      
      // Create the prompt for quest generation
      let prompt = ''
      
      if (customPrompt) {
        const context = campaignContext || {}
        
        // Build enhanced prompt that incorporates advanced inputs when provided
        let enhancedPrompt = `Create a detailed D&D 5e quest for a campaign with:
- Theme: ${context.theme || 'Adventure'}
- Setting: ${context.setting || 'Fantasy world'}
- Main Plot: ${context.mainPlot || 'Epic adventure'}
- Level Range: ${context.levelRange || '1-10'}

Quest Requirements: ${customPrompt}`
        
        // Add advanced inputs if provided
        const advancedInputs = []
        if (name) advancedInputs.push(`named ${name}`)
        if (partyLevel) advancedInputs.push(`party level: ${partyLevel}`)
        if (theme) advancedInputs.push(`theme: ${theme}`)
        if (setting) advancedInputs.push(`setting: ${setting}`)
        if (difficulty) advancedInputs.push(`difficulty: ${difficulty}`)
        if (duration) advancedInputs.push(`duration: ${duration}`)
        
        if (advancedInputs.length > 0) {
          enhancedPrompt += `. Additional specifications: ${advancedInputs.join(', ')}`
        }
        
        prompt = `${enhancedPrompt}

IMPORTANT: This quest should fit into the campaign's narrative and connect to other elements like NPCs, locations, and the main plot.

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any explanatory text before or after the JSON.

Please return ONLY a valid JSON object with this EXACT structure:
{
  "title": "Quest title",
  "description": "Detailed quest description",
  "difficulty": "Easy/Medium/Hard/Deadly/Epic",
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "rewards": "Detailed rewards description",
  "location": "Quest location details",
  "npcs": ["NPC 1 description", "NPC 2 description"],
  "timeline": "Quest timeline and urgency",
  "consequences": "What happens if the quest succeeds or fails",
  "questType": "Type of quest",
  "levelRange": "Recommended character levels",
  "estimatedDuration": "How long the quest should take",
  "connection": "How this quest connects to the campaign's story and other elements"
}`
      } else {
        prompt = `Create a detailed D&D 5e quest with the following parameters:
- Party Level: ${partyLevel || '1-5'}
- Theme: ${theme || 'Adventure'}
- Setting: ${setting || 'Fantasy world'}
- Difficulty: ${difficulty || 'Medium'}
- Duration: ${duration || '1-2 sessions'}
${name ? `- Name: ${name}` : ''}

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any explanatory text before or after the JSON.

Please return ONLY a valid JSON object with this EXACT structure:
{
  "title": "Quest title",
  "description": "Detailed quest description",
  "difficulty": "Easy/Medium/Hard/Deadly/Epic",
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "rewards": "Detailed rewards description",
  "location": "Quest location details",
  "npcs": ["NPC 1 description", "NPC 2 description"],
  "timeline": "Quest timeline and urgency",
  "consequences": "What happens if the quest succeeds or fails",
  "questType": "Type of quest",
  "levelRange": "Recommended character levels",
  "estimatedDuration": "How long the quest should take"
}`
      }

      // Call OpenRouter API
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
              content: 'You are a D&D 5e quest creation expert. You must respond with ONLY valid JSON objects, no other text or explanations. Always format your response as a complete JSON object.'
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
      const data = await apiResponse.json()
      console.log('OpenRouter response:', JSON.stringify(data, null, 2))
      
      // Check if response was truncated
      if (data.choices[0].finish_reason === 'length') {
        console.warn('Response was truncated due to token limit')
      }
      
      // OpenRouter returns content in content field
      const content = data.choices[0].message.content || ''

      // Extract JSON from the response with better error handling
      let quest
      try {
        // First, try to parse the entire content as JSON
        try {
          quest = JSON.parse(content.trim())
        } catch (parseError) {
          // If that fails, try to extract JSON from the content
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            console.error('No JSON found in content:', content)
            throw new Error('Failed to parse quest data from AI response')
          }

          // Try to parse the extracted JSON
          const jsonString = jsonMatch[0]
          try {
            quest = JSON.parse(jsonString)
          } catch (secondError) {
            console.error('JSON parse error:', secondError)
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
              quest = JSON.parse(fixedJson)
            } catch (thirdError) {
              console.error('Third JSON parse error:', thirdError)
              console.error('Attempted to parse:', fixedJson)
              throw new Error('Failed to parse quest data. Please try again.')
            }
          }
        }
      } catch (error) {
        console.error('JSON extraction error:', error)
        throw new Error('Failed to extract quest data from AI response')
      }

      return quest
    }, payload.userId)

    // Deduct tokens after successful generation
    const tokensUsed = await deductTokens(payload.userId, 1)
    if (!tokensUsed) {
      return NextResponse.json(
        { error: 'Failed to deduct tokens. Please try again.' },
        { status: 500 }
      )
    }

    // Auto-save the generated quest
    try {
      await autoSaveContent({
        type: 'quest',
        data: response,
        userId: payload.userId
      })
      console.log('Quest auto-saved successfully')
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      // Don't fail the generation if auto-save fails
    }

    console.log('Quest generated successfully using OpenRouter queue')
    return NextResponse.json({ quest: response })
  } catch (error) {
    console.error('Quest generation error:', error)
    
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
      { error: 'Failed to generate quest. Please try again.' },
      { status: 500 }
    )
  }
} 