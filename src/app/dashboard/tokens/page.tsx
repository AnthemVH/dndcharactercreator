'use client'

import { useState, useEffect } from 'react'
import { Coins, CreditCard, CheckCircle } from 'lucide-react'

interface TokenPackage {
  tokens: number
  price: number
  popular?: boolean
}

const tokenPackages: TokenPackage[] = [
  { tokens: 5, price: 5 },
  { tokens: 15, price: 12, popular: true },
  { tokens: 30, price: 20 },
  { tokens: 60, price: 35 },
]

export default function TokenPurchase() {
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmingPackage, setConfirmingPackage] = useState<TokenPackage | null>(null)

  useEffect(() => {
    loadTokenBalance()
    
    // Check for URL parameters from Paystack redirect
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const tokens = urlParams.get('tokens')
    const error = urlParams.get('error')
    
    if (success === 'true' && tokens) {
      setPurchaseSuccess(true)
      loadTokenBalance() // Refresh balance
      setTimeout(() => setPurchaseSuccess(false), 5000)
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/tokens')
    } else if (error) {
      let errorMessage = 'Payment failed'
      const details = urlParams.get('details')
      
      switch (error) {
        case 'missing_reference':
          errorMessage = 'Payment reference missing - please try again'
          break
        case 'verification_failed':
          errorMessage = 'Payment verification failed - please contact support'
          break
        case 'payment_failed':
          errorMessage = 'Payment was not successful - please try again'
          break
        case 'verification_error':
          errorMessage = 'Error verifying payment - please contact support'
          break
        case 'token_addition_failed':
          errorMessage = details ? `Payment successful but tokens not added: ${details}` : 'Payment successful but tokens not added - please contact support'
          break
        case 'invalid_metadata':
          errorMessage = 'Payment data invalid - please contact support'
          break
        default:
          errorMessage = `Payment error: ${error}`
      }
      alert(errorMessage)
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/tokens')
    }
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
    }
  }

  const handlePurchaseClick = (pkg: TokenPackage) => {
    setConfirmingPackage(pkg)
    setShowConfirmation(true)
  }

  const handleConfirmPurchase = async () => {
    if (!confirmingPackage) return
    
    setIsPurchasing(true)
    setPurchaseSuccess(false)
    setShowConfirmation(false)

    try {
      const response = await fetch('/api/tokens/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAmount: confirmingPackage.tokens
        }),
      })

             if (response.ok) {
         const data = await response.json()
         
         if (data.paymentUrl) {
           // Redirect to Paystack payment page
           window.location.href = data.paymentUrl
         } else {
           // Fallback for successful direct purchase
           setPurchaseSuccess(true)
           await loadTokenBalance() // Refresh balance
           setTimeout(() => setPurchaseSuccess(false), 5000)
         }
       } else {
        const errorData = await response.json()
        alert(errorData.error || 'Purchase failed')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Purchase failed. Please try again.')
    } finally {
      setIsPurchasing(false)
      setConfirmingPackage(null)
    }
  }

  return (
    <div className="min-h-screen fantasy-main">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="fantasy-title text-3xl font-bold mb-2">Token Purchase</h1>
          <p className="fantasy-text">Buy tokens to generate AI-powered D&D content</p>
        </div>

        {/* Current Balance */}
        <div className="fantasy-card p-8 mb-12 max-w-2xl mx-auto">
          <div className="text-center">
            <h2 className="fantasy-title text-2xl font-semibold mb-4">
              Current Balance
            </h2>
            <div className="fantasy-title text-5xl font-bold text-green-700 mb-4">
              {tokenBalance} tokens
            </div>
            <div className="fantasy-text text-sm space-y-1">
              <div>Rate: $5 for 5 tokens</div>
              <div>Usage: 1 token per generation</div>
            </div>
          </div>
        </div>

        {/* Token Packages */}
        <div className="mb-12">
          <h2 className="fantasy-title text-3xl font-bold mb-8 text-center">
            Choose your package
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tokenPackages.map((pkg, index) => (
              <div
                key={index}
                className={`fantasy-card p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  pkg.popular 
                    ? 'border-green-700 ring-2 ring-green-700/20' 
                    : ''
                }`}
              >
                {pkg.popular && (
                  <div className="bg-green-700 text-white text-xs px-3 py-1 rounded-full mb-6 inline-block">
                    Most Popular
                  </div>
                )}
                <div className="text-center">
                  <div className="fantasy-title text-4xl font-bold mb-3">
                    {pkg.tokens} tokens
                  </div>
                  <div className="fantasy-title text-3xl font-bold text-green-700 mb-6">
                    ${pkg.price}
                  </div>
                  <button
                    onClick={() => handlePurchaseClick(pkg)}
                    disabled={isPurchasing}
                    className="w-full fantasy-button-primary py-3 px-6"
                  >
                    {isPurchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing Purchase...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Purchase Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && confirmingPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="fantasy-card p-8 max-w-md mx-4 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <CreditCard className="h-6 w-6 text-yellow-700" />
                </div>
                <h3 className="fantasy-title text-lg font-medium mb-2">
                  Confirm Purchase
                </h3>
                <p className="fantasy-text mb-4">
                  You are about to purchase <span className="font-bold">{confirmingPackage.tokens} tokens</span> for <span className="font-bold">${confirmingPackage.price}</span>
                </p>
                <p className="fantasy-text text-sm mb-4">
                  You will be redirected to Paystack to complete your payment securely. Payment will be processed in South African Rand (ZAR).
                </p>
                <div className="fantasy-card p-3 mb-4">
                  <p className="fantasy-text text-sm">
                    Current Balance: {tokenBalance} tokens
                  </p>
                  <p className="fantasy-text text-xs mt-1">
                    New Balance: {tokenBalance + confirmingPackage.tokens} tokens
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleConfirmPurchase}
                    className="w-full fantasy-button-primary px-4 py-2 flex items-center justify-center"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay with Paystack
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmation(false)
                      setConfirmingPackage(null)
                    }}
                    className="w-full fantasy-button-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {purchaseSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="fantasy-card p-8 max-w-md mx-4 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="fantasy-title text-lg font-medium mb-2">
                  Purchase Successful!
                </h3>
                <p className="fantasy-text mb-4">
                  Your payment was successful! Your tokens have been added to your account. You can now use them for AI generation.
                </p>
                <div className="fantasy-card p-3 mb-4">
                  <p className="fantasy-text text-sm">
                    New Balance: <span className="font-bold">{tokenBalance} tokens</span>
                  </p>
                </div>
                <button
                  onClick={() => setPurchaseSuccess(false)}
                  className="w-full fantasy-button-primary px-4 py-2"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="fantasy-card p-8">
          <h3 className="fantasy-title text-2xl font-semibold mb-6 text-center">
            How it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="fantasy-title text-3xl font-bold text-yellow-700 mb-2">1</div>
              <div className="fantasy-title font-semibold mb-2">Purchase Tokens</div>
              <div className="fantasy-text">Buy tokens at $5 for 5 tokens</div>
            </div>
            <div>
              <div className="fantasy-title text-3xl font-bold text-yellow-700 mb-2">2</div>
              <div className="fantasy-title font-semibold mb-2">Generate Content</div>
              <div className="fantasy-text">Use 1 token per AI generation</div>
            </div>
            <div>
              <div className="fantasy-title text-3xl font-bold text-yellow-700 mb-2">3</div>
              <div className="fantasy-title font-semibold mb-2">Queue System</div>
              <div className="fantasy-text">Fair queue for all users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 