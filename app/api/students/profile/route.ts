import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      bio,
      goals,
      level,
      interests,
      education,
      currentJob,
      experience,
      timezone,
      availability,
      learningStyle,
      motivation,
    } = await request.json()

    // Upsert student profile
    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: session.user.id },
      update: {
        bio,
        goals,
        level,
        interests,
        education,
        currentJob,
        experience,
        timezone,
        availability,
        learningStyle,
        motivation,
      },
      create: {
        userId: session.user.id,
        bio,
        goals,
        level,
        interests,
        education,
        currentJob,
        experience,
        timezone,
        availability,
        learningStyle,
        motivation,
      },
    })

    return NextResponse.json(studentProfile)
  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
