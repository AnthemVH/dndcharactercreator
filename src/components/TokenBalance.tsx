'use client'

import { useState, useEffect } from 'react'

export default function TokenBalance() {
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTokenBalance()
  }, [])

  const loadTokenBalance = async () => {
    try {
      const response = await fetch('/api/tokens/balance')
      if (response.ok) {
        const data = await response.json()
        setTokenBalance(data.tokens)
      }
    } catch (error) {
      console.error('Failed to load token balance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fantasy-card bg-slate-50 border border-slate-200 shadow-lg">
      <div className="fantasy-text text-sm text-slate-600 mb-1">Token Balance</div>
      <div className="fantasy-title text-2xl font-bold text-slate-700">
        {isLoading ? '...' : tokenBalance}
      </div>
      <button 
        onClick={() => window.open('/dashboard/tokens', '_blank')}
        className="mt-2 text-xs fantasy-button-secondary px-3 py-1 hover:bg-slate-600 hover:text-white transition-colors"
      >
        Buy Tokens
      </button>
    </div>
  )
} 