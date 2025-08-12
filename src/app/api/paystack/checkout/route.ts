import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { tokenAmount, amount } = await request.json()

    if (!tokenAmount || !amount) {
      return NextResponse.json(
        { error: 'Token amount and payment amount are required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create Paystack checkout session for token purchase
    const checkoutData = {
      email: user.email,
      amount: amount * 100, // Convert to kobo (smallest currency unit)
      reference: `token_purchase_${user.id}_${Date.now()}`,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/tokens?success=true`,
      metadata: {
        userId: user.id,
        tokenAmount: tokenAmount,
        type: 'token_purchase'
      }
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    })

    if (!paystackResponse.ok) {
      throw new Error('Failed to create Paystack checkout session')
    }

    const paystackData = await paystackResponse.json()

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error('Paystack checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 