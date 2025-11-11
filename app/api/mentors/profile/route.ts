import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        mentorProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching mentor profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      bio,
      expertise,
      experience,
      hourlyRate,
      availability,
      education,
      certifications,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      timezone,
      languages,
    } = await request.json()

    // Upsert mentor profile
    const mentorProfile = await prisma.mentorProfile.upsert({
      where: { userId: session.user.id },
      update: {
        bio,
        expertise,
        experience: experience ? parseInt(experience) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        availability,
        education,
        certifications,
        portfolioUrl,
        linkedinUrl,
        githubUrl,
        timezone,
        languages,
      },
      create: {
        userId: session.user.id,
        bio,
        expertise: expertise || '',
        experience: experience ? parseInt(experience) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        availability,
        education,
        certifications,
        portfolioUrl,
        linkedinUrl,
        githubUrl,
        timezone,
        languages,
      },
    })

    return NextResponse.json(mentorProfile)
  } catch (error) {
    console.error('Error updating mentor profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
