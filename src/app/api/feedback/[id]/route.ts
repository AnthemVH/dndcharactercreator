import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, adminNotes, reviewedBy, reviewedAt } = body

    // Update feedback
    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        status,
        adminNotes,
        reviewedBy,
        reviewedAt: reviewedAt ? new Date(reviewedAt) : null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete feedback
    await prisma.feedback.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Feedback deleted successfully' })
  } catch (error) {
    console.error('Error deleting feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
