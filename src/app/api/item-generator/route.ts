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
    const { name, itemType, theme, customPrompt, skipPortrait = false, campaignContext } = body

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    // Build the prompt based on whether custom prompt is used
    let prompt: string
    if (customPrompt) {
      const context = campaignContext || {}
      
      // Build enhanced prompt that incorporates advanced inputs when provided
      let enhancedPrompt = `Create D&D magical item for a campaign with:
- Theme: ${context.theme || 'Adventure'}
- Setting: ${context.setting || 'Fantasy world'}
- Main Plot: ${context.mainPlot || 'Epic adventure'}
- Level Range: ${context.levelRange || '1-10'}

Item Description: "${customPrompt}"`
      
      // Add advanced inputs if provided
      const advancedInputs = []
      if (name) advancedInputs.push(`named ${name}`)
      if (itemType) advancedInputs.push(`type: ${itemType}`)
      if (theme) advancedInputs.push(`theme: ${theme}`)
      
      if (advancedInputs.length > 0) {
        enhancedPrompt += `. Additional specifications: ${advancedInputs.join(', ')}`
      }
      
      prompt = `${enhancedPrompt}

IMPORTANT: This item should fit into the campaign's narrative and connect to other elements like NPCs, locations, and the main plot.

JSON only:
{
  "name": "Item name",
  "itemType": "Type",
  "theme": "Theme",
  "rarity": "Common/Uncommon/Rare/Very Rare/Legendary/Artifact",
  "description": "Description",
  "properties": ["property1", "property2", "property3"],
  "magicalEffects": ["effect1", "effect2", "effect3"],
  "history": "Brief history",
  "value": "Value in gold",
  "weight": "Weight",
  "requirements": ["req1", "req2"],
  "attunement": boolean,
  "quote": "Quote",
  "uniqueTrait": "Trait",
  "craftingMaterials": ["material1", "material2", "material3"],
  "enchantments": ["enchantment1", "enchantment2"],
  "restrictions": ["restriction1", "restriction2"],
  "connection": "How this item connects to the campaign's story and other elements"
}`
    } else {
      // Validate required fields
      if (!itemType || !theme) {
        return NextResponse.json(
          { error: 'Item type and theme are required' },
          { status: 400 }
        )
      }

      prompt = `Create D&D magical item: ${itemType} ${theme}${name ? ` named ${name}` : ''}. 

JSON only:
{
  "name": "Item name",
  "itemType": "${itemType}",
  "theme": "${theme}",
  "rarity": "Common/Uncommon/Rare/Very Rare/Legendary/Artifact",
  "description": "Description",
  "properties": ["property1", "property2", "property3"],
  "magicalEffects": ["effect1", "effect2", "effect3"],
  "history": "Brief history",
  "value": "Value in gold",
  "weight": "Weight",
  "requirements": ["req1", "req2"],
  "attunement": boolean,
  "quote": "Quote",
  "uniqueTrait": "Trait",
  "craftingMaterials": ["material1", "material2", "material3"],
  "enchantments": ["enchantment1", "enchantment2"],
  "restrictions": ["restriction1", "restriction2"]
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
              content: 'D&D item expert. JSON only, no explanations.'
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
    let item
    try {
      // First, try to parse the entire content as JSON
      try {
        item = JSON.parse(content.trim())
      } catch (parseError) {
        // If that fails, try to extract JSON from the content
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          console.error('No JSON found in content:', content)
          throw new Error('Failed to parse item data from AI response')
        }

        // Try to parse the extracted JSON
        const jsonString = jsonMatch[0]
        try {
          item = JSON.parse(jsonString)
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
            item = JSON.parse(fixedJson)
          } catch (thirdError) {
            console.error('Third JSON parse error:', thirdError)
            console.error('Attempted to parse:', fixedJson)
            throw new Error('Failed to parse item data. Please try again.')
          }
        }
      }
    } catch (error) {
      console.error('JSON extraction error:', error)
      throw new Error('Failed to extract item data from AI response')
    }

    // Validate and enhance the item data
    const enhancedItem = {
      ...item,
      properties: item.properties || ['Magical'],
      magicalEffects: item.magicalEffects || ['Has magical properties'],
      requirements: item.requirements || ['None'],
      craftingMaterials: item.craftingMaterials || ['Unknown materials'],
      enchantments: item.enchantments || ['Basic enchantment'],
      restrictions: item.restrictions || ['None'],
      attunement: item.attunement || false,
    }

    // Portraits are generated via /api/portrait-generator to ensure local persistent URLs
    const portraitUrl = null

    // Deduct tokens after successful generation
    const tokensUsed = await deductTokens(payload.userId, 1)
    if (!tokensUsed) {
      return NextResponse.json(
        { error: 'Failed to deduct tokens. Please try again.' },
        { status: 500 }
      )
    }

    // Auto-save the generated item
    const itemData = {
      ...enhancedItem,
      portrait: portraitUrl
    }
    
    try {
      const savedItem = await autoSaveContent({
        type: 'item',
        data: itemData,
        userId: payload.userId
      })
      
      console.log('Item auto-saved successfully')
    } catch (autoSaveError) {
      console.error('Auto-save error:', autoSaveError)
      // Don't fail the generation if auto-save fails
    }

    console.log('Item generated successfully using OpenRouter queue')
    return NextResponse.json({ 
      item: itemData,
      portraitPending: !skipPortrait
    })
  } catch (error) {
    console.error('Item generation error:', error)
    
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
      { error: 'Failed to generate item. Please try again.' },
      { status: 500 }
    )
  }
} 