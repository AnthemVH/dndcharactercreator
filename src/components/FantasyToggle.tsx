'use client'

import { useState } from 'react'

interface FantasyToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id: string
  className?: string
}

export default function FantasyToggle({ checked, onChange, label, id, className = '' }: FantasyToggleProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggle = () => {
    setIsAnimating(true)
    onChange(!checked)
    setTimeout(() => setIsAnimating(false), 200)
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-in-out
          ${checked 
            ? 'bg-gradient-to-r from-yellow-600 to-orange-600 shadow-lg shadow-yellow-500/30' 
            : 'bg-gray-300'
          }
          ${isAnimating ? 'scale-105' : ''}
          focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
          hover:shadow-md
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-all duration-200 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-1'}
            ${isAnimating ? 'scale-110' : ''}
          `}
        />
        {/* Glow effect when checked */}
        {checked && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse" />
        )}
      </button>
      <label 
        htmlFor={id} 
        className="fantasy-text text-base font-medium cursor-pointer select-none hover:text-slate-600 transition-colors duration-200"
      >
        {label}
      </label>
    </div>
  )
} 