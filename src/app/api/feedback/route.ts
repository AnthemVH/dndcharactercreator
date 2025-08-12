import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, feedbackType, rating, message } = body

    // Basic validation
    if (!name || !message || !feedbackType) {
      return NextResponse.json(
        { error: 'Name, message, and feedback type are required' },
        { status: 400 }
      )
    }

    // Save feedback to database
    const feedback = await prisma.feedback.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        feedbackType,
        rating: rating || null,
        message: message.trim(),
        status: 'new'
      }
    })

    console.log('Feedback saved to database:', feedback)

    return NextResponse.json(
      { 
        message: 'Feedback submitted successfully',
        feedbackId: feedback.id
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all feedback (for admin purposes)
    const feedback = await prisma.feedback.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
