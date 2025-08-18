/**
 * Content formatting utilities for cleaning and displaying generator output
 */

// Clean up coding artifacts from generated text
export function cleanContentString(content: string): string {
  if (!content || typeof content !== 'string') return ''
  
  return content
    // Remove empty quotes and brackets
    .replace(/[""'']/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\{\s*\}/g, '')
    // Remove trailing commas
    .replace(/,\s*(?=[}\]])/g, '')
    // Remove escaped characters
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

// Format arrays for display
export function formatArrayField(field: unknown): string[] {
  if (!field) return []
  
  if (Array.isArray(field)) {
    return field
      .filter(item => item && typeof item === 'string')
      .map(item => cleanContentString(item))
      .filter(item => item.length > 0)
  }
  
  if (typeof field === 'string') {
    // Handle comma-separated strings
    if (field.includes(',')) {
      return field
        .split(',')
        .map(item => cleanContentString(item))
        .filter(item => item.length > 0)
    }
    
    // Handle newline-separated strings
    if (field.includes('\n')) {
      return field
        .split('\n')
        .map(item => cleanContentString(item))
        .filter(item => item.length > 0)
    }
    
    // Single item
    const cleaned = cleanContentString(field)
    return cleaned ? [cleaned] : []
  }
  
  return []
}

// Format a single text field
export function formatTextField(field: unknown): string {
  if (!field) return ''
  
  if (typeof field === 'string') {
    return cleanContentString(field)
  }
  
  if (Array.isArray(field)) {
    return field
      .map(item => cleanContentString(String(item)))
      .filter(item => item.length > 0)
      .join(', ')
  }
  
  return cleanContentString(String(field))
}

// Convert array to HTML list
export function arrayToHtmlList(items: string[], ordered: boolean = false): string {
  if (!items || items.length === 0) return ''
  
  const listItems = items
    .map(item => `<li>${formatTextField(item)}</li>`)
    .join('')
  
  return ordered 
    ? `<ol class="list-decimal list-inside space-y-1 ml-4">${listItems}</ol>`
    : `<ul class="list-disc list-inside space-y-1 ml-4">${listItems}</ul>`
}

// Get CSS classes for list formatting
export function getListClasses(ordered: boolean = false): string {
  return ordered 
    ? "list-decimal list-inside space-y-1 ml-4"
    : "list-disc list-inside space-y-1 ml-4"
}

// Format object fields for display
export function formatObjectForDisplay(obj: Record<string, unknown>): Record<string, string | string[]> {
  const formatted: Record<string, string | string[]> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) || (typeof value === 'string' && (value.includes(',') || value.includes('\n')))) {
      formatted[key] = formatArrayField(value)
    } else {
      formatted[key] = formatTextField(value)
    }
  }
  
  return formatted
}

// Create formatted HTML content for display
export function createFormattedContent(content: Record<string, unknown>, sections: string[]): string {
  let html = ''
  
  for (const section of sections) {
    const value = content[section]
    if (!value) continue
    
    const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')
    
    if (Array.isArray(value) || (typeof value === 'string' && (value.includes(',') || value.includes('\n')))) {
      const items = formatArrayField(value)
      if (items.length > 0) {
        html += `<div class="mb-4">
          <h3 class="text-lg font-semibold text-slate-900 mb-2">${sectionTitle}</h3>
          ${arrayToHtmlList(items)}
        </div>`
      }
    } else {
      const text = formatTextField(value)
      if (text) {
        html += `<div class="mb-4">
          <h3 class="text-lg font-semibold text-slate-900 mb-2">${sectionTitle}</h3>
          <p class="text-slate-700 leading-relaxed">${text}</p>
        </div>`
      }
    }
  }
  
  return html
}

// Helper function to get section title
export function getSectionTitle(section: string): string {
  return section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')
}

// Specifically for character stats formatting
export function formatCharacterStats(stats: unknown): { [key: string]: number } {
  if (!stats || typeof stats !== 'object') return {}
  
  const formattedStats: { [key: string]: number } = {}
  const statObj = stats as Record<string, unknown>
  
  for (const [key, value] of Object.entries(statObj)) {
    if (typeof value === 'number') {
      formattedStats[key] = value
    } else if (typeof value === 'string') {
      const parsed = parseInt(value, 10)
      if (!isNaN(parsed)) {
        formattedStats[key] = parsed
      }
    }
  }
  
  return formattedStats
}
