'use client'

import { useState, useEffect } from 'react'
import { Ruler } from 'lucide-react'

type UnitSystem = 'metric' | 'imperial'

interface UnitToggleProps {
  className?: string
}

export default function UnitToggle({ className = '' }: UnitToggleProps) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial')

  // Load unit system from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('unitSystem')
    if (saved && (saved === 'metric' || saved === 'imperial')) {
      setUnitSystem(saved)
    }
  }, [])

  // Save unit system to localStorage and notify other components
  const handleToggle = () => {
    const newSystem = unitSystem === 'metric' ? 'imperial' : 'metric'
    setUnitSystem(newSystem)
    localStorage.setItem('unitSystem', newSystem)
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('unitSystemChanged', { 
      detail: { unitSystem: newSystem } 
    }))
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg fantasy-button-secondary text-sm font-medium transition-colors ${className}`}
      title={`Switch to ${unitSystem === 'metric' ? 'Imperial' : 'Metric'} units`}
    >
      <Ruler className="w-4 h-4" />
      <span>{unitSystem === 'metric' ? 'Metric' : 'Imperial'}</span>
    </button>
  )
}

// Hook to use unit system in components
export function useUnitSystem() {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('imperial')

  useEffect(() => {
    const saved = localStorage.getItem('unitSystem')
    if (saved && (saved === 'metric' || saved === 'imperial')) {
      setUnitSystem(saved)
    }

    const handleUnitSystemChange = (event: CustomEvent) => {
      setUnitSystem(event.detail.unitSystem)
    }

    window.addEventListener('unitSystemChanged', handleUnitSystemChange as EventListener)
    
    return () => {
      window.removeEventListener('unitSystemChanged', handleUnitSystemChange as EventListener)
    }
  }, [])

  return unitSystem
}

// Utility functions for unit conversion
export function convertWeight(weight: string, targetSystem: 'metric' | 'imperial'): string {
  if (!weight) return weight
  
  const numMatch = weight.match(/(\d+(?:\.\d+)?)/)
  if (!numMatch) return weight
  
  const num = parseFloat(numMatch[1])
  const unit = weight.replace(numMatch[1], '').trim().toLowerCase()
  
  if (targetSystem === 'metric') {
    // Convert to metric
    if (unit.includes('lb') || unit.includes('pound')) {
      return `${(num * 0.453592).toFixed(1)} kg`
    }
    if (unit.includes('oz') || unit.includes('ounce')) {
      return `${(num * 0.0283495).toFixed(2)} kg`
    }
    return weight // Assume already metric if no imperial units found
  } else {
    // Convert to imperial
    if (unit.includes('kg') || unit.includes('kilogram')) {
      return `${(num * 2.20462).toFixed(1)} lbs`
    }
    if (unit.includes('g') || unit.includes('gram')) {
      return `${(num * 0.035274).toFixed(1)} oz`
    }
    return weight // Assume already imperial if no metric units found
  }
}

export function convertDistance(distance: string, targetSystem: 'metric' | 'imperial'): string {
  if (!distance) return distance
  
  const numMatch = distance.match(/(\d+(?:\.\d+)?)/)
  if (!numMatch) return distance
  
  const num = parseFloat(numMatch[1])
  const unit = distance.replace(numMatch[1], '').trim().toLowerCase()
  
  if (targetSystem === 'metric') {
    // Convert to metric
    if (unit.includes('ft') || unit.includes('foot') || unit.includes('feet')) {
      return `${(num * 0.3048).toFixed(1)} m`
    }
    if (unit.includes('mi') || unit.includes('mile')) {
      return `${(num * 1.60934).toFixed(1)} km`
    }
    if (unit.includes('in') || unit.includes('inch')) {
      return `${(num * 0.0254).toFixed(2)} m`
    }
    return distance // Assume already metric if no imperial units found
  } else {
    // Convert to imperial
    if (unit.includes('m') || unit.includes('meter')) {
      return `${(num * 3.28084).toFixed(1)} ft`
    }
    if (unit.includes('km') || unit.includes('kilometer')) {
      return `${(num * 0.621371).toFixed(1)} mi`
    }
    if (unit.includes('cm') || unit.includes('centimeter')) {
      return `${(num * 0.393701).toFixed(1)} in`
    }
    return distance // Assume already imperial if no metric units found
  }
}

export function convertSpeed(speed: string, targetSystem: 'metric' | 'imperial'): string {
  if (!speed) return speed
  
  const numMatch = speed.match(/(\d+(?:\.\d+)?)/)
  if (!numMatch) return speed
  
  const num = parseFloat(numMatch[1])
  const unit = speed.replace(numMatch[1], '').trim().toLowerCase()
  
  if (targetSystem === 'metric') {
    // Convert to metric
    if (unit.includes('mph')) {
      return `${(num * 1.60934).toFixed(1)} km/h`
    }
    return speed // Assume already metric if no imperial units found
  } else {
    // Convert to imperial
    if (unit.includes('km/h') || unit.includes('kph')) {
      return `${(num * 0.621371).toFixed(1)} mph`
    }
    return speed // Assume already imperial if no metric units found
  }
} 