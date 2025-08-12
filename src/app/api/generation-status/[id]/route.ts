import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: generationId } = await params
    
    // Get generation status from database
    const generation = await prisma.generationStatus.findFirst({
      where: {
        id: generationId,
        userId: payload.userId
      }
    })

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: generation.id,
      status: generation.status,
      progress: generation.progress,
      stage: generation.stage,
      estimatedTime: generation.estimatedTime,
      result: generation.result,
      error: generation.error,
      createdAt: generation.createdAt,
      updatedAt: generation.updatedAt
    })
  } catch (error) {
    console.error('Error fetching generation status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generation status' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: generationId } = await params
    const body = await request.json()
    const { status, progress, stage, estimatedTime, result, error } = body

    // Update or create generation status
    const generation = await prisma.generationStatus.upsert({
      where: {
        id: generationId
      },
      update: {
        status,
        progress,
        stage,
        estimatedTime,
        result: result ? JSON.stringify(result) : null,
        error,
        updatedAt: new Date()
      },
      create: {
        id: generationId,
        userId: payload.userId,
        status,
        progress,
        stage,
        estimatedTime,
        result: result ? JSON.stringify(result) : null,
        error,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      id: generation.id,
      status: generation.status,
      progress: generation.progress,
      stage: generation.stage,
      estimatedTime: generation.estimatedTime,
      result: generation.result ? JSON.parse(generation.result) : null,
      error: generation.error,
      createdAt: generation.createdAt,
      updatedAt: generation.updatedAt
    })
  } catch (error) {
    console.error('Error updating generation status:', error)
    return NextResponse.json(
      { error: 'Failed to update generation status' },
      { status: 500 }
    )
  }
} 