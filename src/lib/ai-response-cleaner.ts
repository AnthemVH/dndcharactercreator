/**
 * Utilities for cleaning and parsing AI responses
 */

export interface CleanedResponse {
  data: any
  wasFixed: boolean
  errors: string[]
}

// Clean up common AI response artifacts
export function cleanAIResponse(content: string): CleanedResponse {
  const errors: string[] = []
  let wasFixed = false
  let cleanedContent = content

  try {
    // Remove markdown code blocks
    const codeBlockMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      cleanedContent = codeBlockMatch[1]
      wasFixed = true
    }

    // Find JSON object boundaries
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedContent = jsonMatch[0]
    }

    // Fix common JSON issues
    cleanedContent = cleanedContent
      // Remove trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix unclosed objects/arrays due to truncation
      .replace(/,\s*$/, '')
      // Remove extra quotes and artifacts
      .replace(/[""'']/g, '"')
      // Fix escaped quotes
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      
    // Try to balance braces and brackets
    const openBraces = (cleanedContent.match(/\{/g) || []).length
    const closeBraces = (cleanedContent.match(/\}/g) || []).length
    const openBrackets = (cleanedContent.match(/\[/g) || []).length
    const closeBrackets = (cleanedContent.match(/\]/g) || []).length

    // Add missing closing braces/brackets
    if (openBraces > closeBraces) {
      cleanedContent += '}'.repeat(openBraces - closeBraces)
      wasFixed = true
    }
    if (openBrackets > closeBrackets) {
      cleanedContent += ']'.repeat(openBrackets - closeBrackets)
      wasFixed = true
    }

    // Parse the cleaned JSON
    const data = JSON.parse(cleanedContent)
    
    return {
      data,
      wasFixed,
      errors
    }
  } catch (error) {
    errors.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    // Attempt to extract partial data for common patterns
    try {
      const partialData = extractPartialData(content)
      if (partialData) {
        return {
          data: partialData,
          wasFixed: true,
          errors
        }
      }
    } catch (partialError) {
      errors.push(`Partial extraction failed: ${partialError instanceof Error ? partialError.message : 'Unknown error'}`)
    }

    throw new Error(`Failed to parse AI response: ${errors.join(', ')}`)
  }
}

// Extract partial data when JSON parsing completely fails
function extractPartialData(content: string): any | null {
  const data: any = {}
  
  // Try to extract common fields using regex patterns
  const patterns = {
    name: /"name"\s*:\s*"([^"]+)"/,
    race: /"race"\s*:\s*"([^"]+)"/,
    class: /"class"\s*:\s*"([^"]+)"/,
    background: /"background"\s*:\s*"([^"]+)"/,
    description: /"description"\s*:\s*"([^"]+)"/,
    quote: /"quote"\s*:\s*"([^"]+)"/,
    uniqueTrait: /"uniqueTrait"\s*:\s*"([^"]+)"/,
    theme: /"theme"\s*:\s*"([^"]+)"/,
    setting: /"setting"\s*:\s*"([^"]+)"/,
  }

  let foundAny = false
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = content.match(pattern)
    if (match) {
      data[key] = match[1]
      foundAny = true
    }
  }

  // Try to extract arrays
  const arrayPatterns = {
    personalityTraits: /"personalityTraits"\s*:\s*\[([\s\S]*?)\]/,
    proficiencies: /"proficiencies"\s*:\s*\[([\s\S]*?)\]/,
    features: /"features"\s*:\s*\[([\s\S]*?)\]/,
    locations: /"locations"\s*:\s*\[([\s\S]*?)\]/,
    characters: /"characters"\s*:\s*\[([\s\S]*?)\]/,
    quests: /"quests"\s*:\s*\[([\s\S]*?)\]/,
  }

  for (const [key, pattern] of Object.entries(arrayPatterns)) {
    const match = content.match(pattern)
    if (match) {
      try {
        // Parse array content
        const arrayContent = match[1]
        const items = arrayContent
          .split(',')
          .map(item => item.replace(/"/g, '').trim())
          .filter(item => item.length > 0)
        if (items.length > 0) {
          data[key] = items
          foundAny = true
        }
      } catch (arrayError) {
        // Ignore array parsing errors
      }
    }
  }

  return foundAny ? data : null
}

// Normalize data fields to ensure consistency
export function normalizeData(data: any): any {
  if (!data || typeof data !== 'object') return data

  const normalized = { ...data }

  // Ensure arrays are actually arrays
  const arrayFields = [
    'personalityTraits', 'proficiencies', 'features', 'locations', 
    'characters', 'quests', 'encounters', 'rewards', 'challenges',
    'objectives', 'enemies', 'environment', 'consequences', 'subPlots',
    'motivations', 'goals', 'fears', 'relationships', 'abilities',
    'equipment', 'secrets', 'personality', 'appearance'
  ]

  for (const field of arrayFields) {
    if (field in normalized) {
      normalized[field] = normalizeToArray(normalized[field])
    }
  }

  // Ensure strings are cleaned
  const stringFields = [
    'name', 'race', 'class', 'background', 'description', 'quote', 
    'uniqueTrait', 'theme', 'setting', 'plot', 'backstory', 'timeline',
    'notes', 'mainPlot', 'role'
  ]

  for (const field of stringFields) {
    if (field in normalized && typeof normalized[field] === 'string') {
      normalized[field] = cleanString(normalized[field])
    }
  }

  // Ensure numbers are actually numbers
  const numberFields = [
    'level', 'hitPoints', 'armorClass', 'initiative', 'speed',
    'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'
  ]

  for (const field of numberFields) {
    if (field in normalized) {
      const num = parseInt(String(normalized[field]), 10)
      if (!isNaN(num)) {
        normalized[field] = num
      }
    }
  }

  return normalized
}

// Convert various formats to arrays
function normalizeToArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => cleanString(String(item))).filter(item => item.length > 0)
  }
  
  if (typeof value === 'string') {
    // Handle comma-separated values
    if (value.includes(',')) {
      return value.split(',').map(item => cleanString(item)).filter(item => item.length > 0)
    }
    
    // Handle newline-separated values
    if (value.includes('\n')) {
      return value.split('\n').map(item => cleanString(item)).filter(item => item.length > 0)
    }
    
    // Single value
    const cleaned = cleanString(value)
    return cleaned ? [cleaned] : []
  }
  
  return []
}

// Clean individual strings
function cleanString(str: string): string {
  if (typeof str !== 'string') return ''
  
  return str
    // Remove extra quotes
    .replace(/^["'`]+|["'`]+$/g, '')
    // Remove escaped characters
    .replace(/\\(.)/g, '$1')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()
}
