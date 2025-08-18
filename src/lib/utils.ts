/**
 * Utility functions for the D&D Master Tools application
 */

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Get ability score modifier
 */
export function getModifier(stat: number): string {
  const modifier = Math.floor((stat - 10) / 2)
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

/**
 * Get color class for ability scores
 */
export function getStatColor(stat: number): string {
  if (stat >= 18) return 'text-purple-600'
  if (stat >= 16) return 'text-blue-600'
  if (stat >= 14) return 'text-green-600'
  if (stat >= 12) return 'text-yellow-600'
  if (stat >= 10) return 'text-gray-600'
  return 'text-red-600'
}

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'common':
      return 'text-gray-600'
    case 'uncommon':
      return 'text-green-600'
    case 'rare':
      return 'text-blue-600'
    case 'very rare':
      return 'text-purple-600'
    case 'legendary':
      return 'text-orange-600'
    default:
      return 'text-gray-600'
  }
}

/**
 * Clean up localStorage state
 */
export function clearLocalStorageState(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error clearing localStorage for ${key}:`, error)
  }
}

/**
 * Save state to localStorage with error handling
 */
export function saveToLocalStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving to localStorage for ${key}:`, error)
  }
}

/**
 * Load state from localStorage with error handling
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error(`Error loading from localStorage for ${key}:`, error)
  }
  return defaultValue
}

/**
 * Parses a variety of field formats back to a string array.
 * Accepts:
 * - stringified JSON arrays
 * - pipe-separated legacy strings (e.g., "a|b|c")
 * - native arrays
 * - plain objects (uses object values)
 */
export function parseArrayField(field: unknown): string[] {
  if (field == null) return []

  // If already an array, coerce items to strings
  if (Array.isArray(field)) {
    return field
      .map(item => String(item))
      .map(item => item.trim())
      .filter(item => item !== '')
  }

  // If it's a string, try JSON first then fallback to legacy format
  if (typeof field === 'string') {
    const stringValue = field.trim()
    if (stringValue === '') return []
    try {
      const parsed = JSON.parse(stringValue)
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => String(item))
          .map(item => item.trim())
          .filter(item => item !== '')
      }
    } catch {
      // not JSON, continue to fallback
    }
    return stringValue
      .split('|')
      .map(item => item.trim())
      .filter(item => item !== '')
  }

  // If it's a plain object (including Set/Map like objects), use values
  if (typeof field === 'object') {
    try {
      const values = Object.values(field as Record<string, unknown>)
      return values
        .map(item => String(item))
        .map(item => item.trim())
        .filter(item => item !== '')
    } catch {
      return []
    }
  }

  return []
}

/**
 * Converts weight from pounds to kilograms or vice versa
 */
export function convertWeight(weight: string, unitSystem: 'metric' | 'imperial'): string {
  try {
    const numericWeight = parseFloat(weight.replace(/[^\d.]/g, ''))
    if (isNaN(numericWeight)) return weight
    
    if (unitSystem === 'metric') {
      // Convert pounds to kilograms
      const kg = numericWeight * 0.453592
      return `${kg.toFixed(1)} kg`
    } else {
      // Convert kilograms to pounds
      const lbs = numericWeight * 2.20462
      return `${lbs.toFixed(1)} lbs`
    }
  } catch {
    return weight
  }
}

/**
 * Converts distance from feet to meters or vice versa
 */
export function convertDistance(distance: number, unitSystem: 'metric' | 'imperial'): string {
  if (unitSystem === 'metric') {
    // Convert feet to meters
    const meters = distance * 0.3048
    return `${Math.round(meters)} m`
  } else {
    // Keep as feet
    return `${distance} ft`
  }
}

/**
 * Converts speed from feet per round to meters per round or vice versa
 */
export function convertSpeed(speed: number, unitSystem: 'metric' | 'imperial'): string {
  if (unitSystem === 'metric') {
    // Convert feet to meters
    const meters = speed * 0.3048
    return `${Math.round(meters)} m/round`
  } else {
    // Keep as feet per round
    return `${speed} ft/round`
  }
} 

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 