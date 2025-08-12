import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { addTokens, TOKEN_PRICES } from '@/lib/tokens'

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
    const { tokenAmount } = body

    if (!tokenAmount || tokenAmount < 5) {
      return NextResponse.json(
        { error: 'Minimum purchase is 5 tokens' },
        { status: 400 }
      )
    }

    // Calculate price in USD
    const priceUSD = (tokenAmount / 5) * 5 // $5 for 5 tokens
    const priceZAR = priceUSD * 18 // Convert to ZAR
    const amountInCents = Math.round(priceZAR * 100) // Convert to cents

    // Generate unique reference
    const reference = `token_purchase_${payload.userId}_${Date.now()}`

    // Initialize Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: payload.email,
        amount: amountInCents,
        currency: 'ZAR',
        reference: reference,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tokens/purchase/callback`,
        metadata: {
          userId: payload.userId,
          tokenAmount: tokenAmount,
          type: 'token_purchase',
          priceUSD: priceUSD,
          priceZAR: priceZAR
        }
      }),
    })

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json()
      console.error('Paystack initialization error:', errorData)
      return NextResponse.json(
        { error: errorData.message || 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    const paystackData = await paystackResponse.json()
    
    if (paystackData.status && paystackData.data) {
      console.log(`Payment initialized for user ${payload.userId}: ${tokenAmount} tokens for ${priceZAR} ZAR`)
      return NextResponse.json({
        success: true,
        paymentUrl: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        message: `Redirecting to payment for ${tokenAmount} tokens`
      })
    } else {
      console.error('Paystack error:', paystackData)
      return NextResponse.json(
        { error: paystackData.message || 'Failed to initialize payment' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Token purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to process token purchase' },
      { status: 500 }
    )
  }
} 