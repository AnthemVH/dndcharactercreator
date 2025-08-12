import { NextRequest, NextResponse } from 'next/server'
import { addTokens } from '@/lib/tokens'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify Paystack signature
    const signature = request.headers.get('x-paystack-signature')
    const secret = process.env.PAYSTACK_SECRET_KEY
    
    if (!signature || !secret) {
      console.error('Missing signature or secret in webhook')
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(body))
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid signature in webhook')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Check if payment was successful
    if (body.event === 'charge.success') {
      const { metadata } = body.data
      const userId = metadata.userId
      const tokenAmount = metadata.tokenAmount

      if (userId && tokenAmount) {
        try {
          // Add tokens to user account
          await addTokens(userId, parseInt(tokenAmount))
          
          console.log(`Webhook: Payment successful: ${tokenAmount} tokens added to user ${userId}`)
          
          return NextResponse.json({ 
            success: true, 
            message: 'Tokens added successfully' 
          })
        } catch (error) {
          console.error('Error adding tokens in webhook:', error)
          return NextResponse.json({ error: 'Failed to add tokens' }, { status: 500 })
        }
      } else {
        console.error('Missing userId or tokenAmount in webhook metadata')
        return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 })
      }
    }

    console.log(`Webhook received: ${body.event} - not a successful charge`)
    return NextResponse.json({ 
      success: false, 
      message: 'Payment not successful' 
    })
  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment callback' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')
    const trxref = searchParams.get('trxref')
    
    if (!reference || !trxref) {
      console.error('Missing reference or trxref in redirect')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/tokens?error=missing_reference`)
    }

    console.log(`Verifying transaction: ${reference}`)

    // Verify the transaction with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    if (!verifyResponse.ok) {
      console.error('Paystack verification failed:', verifyResponse.status)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/tokens?error=verification_failed`)
    }

    const verifyData = await verifyResponse.json()
    
    if (verifyData.status && verifyData.data.status === 'success') {
      const { metadata } = verifyData.data
      const userId = metadata.userId
      const tokenAmount = metadata.tokenAmount

      if (userId && tokenAmount) {
        try {
          // Add tokens to user account
          await addTokens(userId, parseInt(tokenAmount))
          
          console.log(`Redirect verification: ${tokenAmount} tokens added to user ${userId}`)
          
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/tokens?success=true&tokens=${tokenAmount}`)
                 } catch (error) {
           console.error('Error adding tokens in redirect:', error)
           const errorMessage = error instanceof Error ? error.message : 'Unknown error'
           return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/tokens?error=token_addition_failed&details=${encodeURIComponent(errorMessage)}`)
         }
      } else {
        console.error('Missing userId or tokenAmount in verification metadata')
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/tokens?error=invalid_metadata`)
      }
    } else {
      console.error('Payment verification failed:', verifyData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/tokens?error=payment_failed`)
    }
  } catch (error) {
    console.error('Payment redirect error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/tokens?error=verification_error`)
  }
} 