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
    const { 
      playerCount, 
      theme, 
      difficulty, 
      levelRange, 
      setting, 
      estimatedDuration,
      customPrompt,
      characterSlots,
      campaignContext,
      generateTypes
    } = body

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    // Check if user has enough tokens (campaign generation costs more tokens)
    const hasTokens = await hasEnoughTokens(payload.userId)
    if (!hasTokens) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please purchase more tokens to continue.' },
        { status: 402 }
      )
    }

    // Build the prompt based on whether custom prompt is used
    let prompt: string
    
    if (generateTypes && Array.isArray(generateTypes)) {
      // Integrated generation - generate specific content types that work together
      const context = campaignContext || {}
      const contentTypes = generateTypes.join(', ')
      
      prompt = `Generate integrated D&D campaign content for a campaign with:
- Theme: ${context.theme || theme || 'Adventure'}
- Setting: ${context.setting || setting || 'Fantasy world'}
- Main Plot: ${context.mainPlot || 'Epic adventure'}
- Level Range: ${context.levelRange || levelRange || '1-10'}
- Difficulty: ${context.difficulty || difficulty || 'Medium'}

Generate ONLY the following content types: ${contentTypes}

IMPORTANT: All generated content must work together cohesively. NPCs should be connected to locations and quests. Locations should be relevant to the main plot. Quests should involve the NPCs and locations. Everything should form a unified narrative.

CRITICAL: Respond with ONLY a valid JSON object containing ONLY the requested content types. No markdown, no code blocks, no explanatory text. Start with { and end with }.

Generate content with this structure (only include the requested types):
${generateTypes.includes('mainPlot') ? `"mainPlot": "Main story arc that ties everything together",` : ''}
${generateTypes.includes('subPlots') ? `"subPlots": ["Sub-plot 1", "Sub-plot 2"],` : ''}
${generateTypes.includes('majorNPCs') ? `"majorNPCs": [
  {
    "name": "NPC name",
    "role": "Their role in the story",
    "description": "Brief description",
    "motivation": "What they want",
    "location": "Where they can be found",
    "connection": "How they connect to other elements"
  }
],` : ''}
${generateTypes.includes('locations') ? `"locations": [
  {
    "name": "Location name",
    "description": "Location description",
    "significance": "Why it's important to the story",
    "secrets": "Hidden aspects",
    "connections": "How it connects to NPCs and quests"
  }
],` : ''}
${generateTypes.includes('quests') ? `"quests": [
  {
    "title": "Quest title",
    "description": "Quest description",
    "difficulty": "Easy/Medium/Hard",
    "objectives": ["Objective 1", "Objective 2"],
    "rewards": "What players gain",
    "location": "Where it takes place",
    "involvedNPCs": "Which NPCs are involved"
  }
],` : ''}
${generateTypes.includes('encounters') ? `"encounters": [
  {
    "name": "Encounter name",
    "description": "Encounter description",
    "difficulty": "Easy/Medium/Hard/Deadly",
    "enemies": "What enemies are involved",
    "environment": "Terrain and conditions",
    "objectives": ["Objective 1", "Objective 2"],
    "location": "Where this encounter occurs"
  }
],` : ''}
${generateTypes.includes('items') ? `"items": [
  {
    "name": "Item name",
    "type": "Item type",
    "rarity": "Item rarity",
    "description": "Item description",
    "powers": "Special abilities",
    "origin": "Where it comes from",
    "connection": "How it relates to the story"
  }
]` : ''}

Make sure all elements reference and connect to each other to create a cohesive campaign experience.`
    } else if (customPrompt) {
      prompt = `Create a complete D&D 5e campaign based on this description: "${customPrompt}".

CRITICAL: Respond with ONLY a valid JSON object. No markdown, no code blocks, no explanatory text. Start with { and end with }.

Generate a campaign with this EXACT structure (keep descriptions concise to avoid truncation):
{
  "name": "Campaign name",
  "description": "Brief campaign overview",
  "theme": "Campaign theme",
  "difficulty": "Easy/Medium/Hard/Deadly",
  "playerCount": ${playerCount || 4},
  "characterSlots": ${characterSlots || 4},
  "levelRange": "${levelRange || '1-10'}",
  "estimatedDuration": "${estimatedDuration || '3-6 months'}",
  "setting": "Campaign setting",
  "mainPlot": "Main story arc",
  "subPlots": ["Sub-plot 1", "Sub-plot 2"],
  "majorNPCs": [
    {
      "name": "NPC name",
      "role": "Their role",
      "description": "Brief description",
      "motivation": "What they want",
      "location": "Where they can be found"
    }
  ],
  "locations": [
    {
      "name": "Location name",
      "description": "Location description",
      "significance": "Why it's important",
      "secrets": "Hidden aspects"
    }
  ],
  "quests": [
    {
      "title": "Quest title",
      "description": "Quest description",
      "difficulty": "Easy/Medium/Hard",
      "objectives": ["Objective 1", "Objective 2"],
      "rewards": "What players gain",
      "location": "Where it takes place"
    }
  ],
  "encounters": [
    {
      "name": "Encounter name",
      "description": "Encounter description",
      "difficulty": "Easy/Medium/Hard/Deadly",
      "enemies": "What enemies are involved",
      "environment": "Terrain and conditions",
      "objectives": ["Objective 1", "Objective 2"]
    }
  ],
  "characters": [
    {
      "name": "Character name",
      "race": "Character race",
      "class": "Character class",
      "background": "Character background",
      "personality": "Key personality traits",
      "motivation": "What drives them",
      "backstory": "Brief backstory"
    }
  ],
  "items": [
    {
      "name": "Item name",
      "type": "Item type",
      "rarity": "Item rarity",
      "description": "Item description",
      "significance": "Why it's important"
    }
  ],
  "notes": "Additional campaign notes and tips for the DM"
}

Keep all descriptions concise to avoid response truncation.`
    } else {
      // Validate required fields
      if (!playerCount || !theme || !difficulty) {
        return NextResponse.json(
          { error: 'Player count, theme, and difficulty are required' },
          { status: 400 }
        )
      }

      prompt = `Create a complete D&D 5e campaign with the following specifications:
- Player Count: ${playerCount}
- Theme: ${theme}
- Difficulty: ${difficulty}
- Level Range: ${levelRange || '1-10'}
- Setting: ${setting || 'Fantasy world'}
- Estimated Duration: ${estimatedDuration || '3-6 months'}

CRITICAL: Respond with ONLY a valid JSON object. No markdown, no code blocks, no explanatory text. Start with { and end with }.

Generate a campaign with this EXACT structure (keep descriptions concise to avoid truncation):
{
  "name": "Campaign name",
  "description": "Brief campaign overview",
  "theme": "${theme}",
  "difficulty": "${difficulty}",
  "playerCount": ${playerCount},
  "levelRange": "${levelRange || '1-10'}",
  "estimatedDuration": "${estimatedDuration || '3-6 months'}",
  "setting": "${setting || 'Fantasy world'}",
  "mainPlot": "Main story arc",
  "subPlots": ["Sub-plot 1", "Sub-plot 2"],
  "majorNPCs": [
    {
      "name": "NPC name",
      "role": "Their role",
      "description": "Brief description",
      "motivation": "What they want",
      "location": "Where they can be found"
    }
  ],
  "locations": [
    {
      "name": "Location name",
      "description": "Location description",
      "significance": "Why it's important",
      "secrets": "Hidden aspects"
    }
  ],
  "quests": [
    {
      "title": "Quest title",
      "description": "Quest description",
      "difficulty": "Easy/Medium/Hard",
      "objectives": ["Objective 1", "Objective 2"],
      "rewards": "What players gain",
      "location": "Where it takes place"
    }
  ],
  "encounters": [
    {
      "name": "Encounter name",
      "description": "Encounter description",
      "difficulty": "Easy/Medium/Hard/Deadly",
      "enemies": "What enemies are involved",
      "environment": "Terrain and conditions",
      "objectives": ["Objective 1", "Objective 2"]
    }
  ],
  "characters": [
    {
      "name": "Character name",
      "race": "Character race",
      "class": "Character class",
      "background": "Character background",
      "personality": "Key personality traits",
      "motivation": "What drives them",
      "backstory": "Brief backstory"
    }
  ],
  "items": [
    {
      "name": "Item name",
      "type": "Item type",
      "rarity": "Item rarity",
      "description": "Item description",
      "significance": "Why it's important"
    }
  ],
  "notes": "Additional campaign notes and tips for the DM"
}

Keep all descriptions concise to avoid response truncation.`
    }

    // Use the queue system for OpenRouter API calls
    const response = await openRouterQueue.add(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // Reduced to 1 minute timeout for campaign generation
      
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
              content: 'You are a D&D 5e campaign creation expert. You must respond with ONLY valid JSON objects, no markdown formatting, code blocks, or explanatory text. Always format your response as a complete JSON object without any markdown syntax.'
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
    let campaign
    try {
      // First, try to parse the entire content directly
      try {
        campaign = JSON.parse(content.trim())
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
            { error: 'Failed to parse campaign data from AI response' },
            { status: 500 }
          )
        }

        // Try to parse the extracted JSON
        const jsonString = jsonMatch[1] || jsonMatch[0]
        try {
          campaign = JSON.parse(jsonString)
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
          
          // Additional fixes for common JSON issues
          fixedJson = fixedJson
            .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas before closing brackets
            .replace(/,\s*$/g, '') // Remove trailing commas at the end
            .replace(/\[\s*,\s*\]/g, '[]') // Fix empty arrays with commas
            .replace(/\{\s*,\s*\}/g, '{}') // Fix empty objects with commas
          
          // Try to complete incomplete arrays and objects
          const openBraces = (fixedJson.match(/\{/g) || []).length
          const closeBraces = (fixedJson.match(/\}/g) || []).length
          const openBrackets = (fixedJson.match(/\[/g) || []).length
          const closeBrackets = (fixedJson.match(/\]/g) || []).length
          
          // Add missing closing brackets
          for (let i = 0; i < openBraces - closeBraces; i++) {
            fixedJson += '}'
          }
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            fixedJson += ']'
          }
          
          try {
            campaign = JSON.parse(fixedJson)
          } catch (secondError) {
            console.error('Second JSON parse error:', secondError)
            console.error('Attempted to parse:', fixedJson)
            
            // Last resort: try to create a minimal valid campaign structure
            try {
              const fallbackCampaign = {
                name: "Generated Campaign",
                description: "A campaign generated from your specifications",
                theme: theme || "Adventure",
                difficulty: difficulty || "Medium",
                playerCount: playerCount || 4,
                levelRange: levelRange || "1-10",
                estimatedDuration: estimatedDuration || "3-6 months",
                setting: setting || "Fantasy world",
                mainPlot: "The main story arc of your campaign",
                subPlots: ["Sub-plot 1", "Sub-plot 2"],
                majorNPCs: [
                  {
                    name: "Important NPC",
                    role: "Key character",
                    description: "A significant NPC in your campaign",
                    motivation: "Their goals and desires",
                    location: "Where they can be found"
                  }
                ],
                locations: [
                  {
                    name: "Starting Location",
                    description: "Where the campaign begins",
                    significance: "Important to the story",
                    secrets: "Hidden aspects of this location"
                  }
                ],
                quests: [],
                encounters: [],
                characters: [],
                items: [],
                notes: "Campaign notes and tips for the DM"
              }
              
              campaign = fallbackCampaign
              console.log('Using fallback campaign structure due to JSON parsing issues')
            } catch (fallbackError) {
              console.error('Fallback campaign creation failed:', fallbackError)
              return NextResponse.json(
                { error: 'Failed to parse campaign data. Please try again.' },
                { status: 500 }
              )
            }
          }
        }
      }
    } catch (error) {
      console.error('JSON extraction error:', error)
      return NextResponse.json(
        { error: 'Failed to extract campaign data from AI response' },
        { status: 500 }
      )
    }

    // Handle integrated generation vs full campaign generation
    if (generateTypes && Array.isArray(generateTypes)) {
      // For integrated generation, return only the requested content types
      const integratedContent = {}
      
      generateTypes.forEach(type => {
        if (campaign[type] !== undefined) {
          integratedContent[type] = campaign[type]
        }
      })
      
      // Deduct tokens based on number of content types generated
      const tokensUsed = await deductTokens(payload.userId, generateTypes.length)
      if (!tokensUsed) {
        return NextResponse.json(
          { error: 'Failed to deduct tokens. Please try again.' },
          { status: 500 }
        )
      }
      
      console.log('Integrated content generated successfully')
      return NextResponse.json(integratedContent)
    } else {
      // For full campaign generation, enhance and return complete campaign
      const enhancedCampaign = {
        ...campaign,
        playerCount: campaign.playerCount || playerCount || 4,
        levelRange: campaign.levelRange || levelRange || '1-10',
        estimatedDuration: campaign.estimatedDuration || estimatedDuration || '3-6 months',
        difficulty: campaign.difficulty || difficulty || 'Medium',
        theme: campaign.theme || theme || 'Adventure',
        setting: campaign.setting || setting || 'Fantasy world',
        subPlots: campaign.subPlots || [],
        majorNPCs: campaign.majorNPCs || [],
        locations: campaign.locations || [],
        quests: campaign.quests || [],
        encounters: campaign.encounters || [],
        characters: campaign.characters || [],
        items: campaign.items || [],
        notes: campaign.notes || 'Additional campaign notes and tips for the DM'
      }

      // Deduct tokens after successful generation (campaign generation costs more tokens)
      const tokensUsed = await deductTokens(payload.userId, 3)
      if (!tokensUsed) {
        return NextResponse.json(
          { error: 'Failed to deduct tokens. Please try again.' },
          { status: 500 }
        )
      }

      // Auto-save the generated campaign
      try {
        await autoSaveContent({
          type: 'campaign',
          data: enhancedCampaign,
          userId: payload.userId
        })
        console.log('Campaign auto-saved successfully')
      } catch (autoSaveError) {
        console.error('Auto-save error:', autoSaveError)
        // Don't fail the generation if auto-save fails
      }

      console.log('Campaign generated successfully using OpenRouter queue')
      return NextResponse.json({ campaign: enhancedCampaign })
    }
  } catch (error) {
    console.error('Campaign generation error:', error)
    
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
      { error: 'Failed to generate campaign. Please try again.' },
      { status: 500 }
    )
  }
} 