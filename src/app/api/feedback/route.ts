import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    const { data: feedback, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        feedback_type: feedbackType,
        rating: rating || null,
        message: message.trim(),
        status: 'new'
      })
      .select('*')
      .single()
    if (error) throw error

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
    const { data: feedback, error } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
