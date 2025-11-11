import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        mentorProfile: true,
        studentProfile: true,
        enrollments: {
          include: {
            course: true,
            payments: true,
          },
        },
        mentorAssignments: {
          include: {
            student: true,
            course: true,
            enrollment: true,
          },
        },
        studentAssignments: {
          include: {
            mentor: true,
            course: true,
            enrollment: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            mentorAssignments: true,
            studentAssignments: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { name, email, phone, address, role, bio, expertise, experience, interests, education } = await request.json()

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update basic user information
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (role) updateData.role = role

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    // Update mentor profile if role is MENTOR
    if (role === 'MENTOR') {
      const mentorProfileData: any = {}
      if (bio !== undefined) mentorProfileData.bio = bio
      if (expertise !== undefined) mentorProfileData.expertise = expertise
      if (experience !== undefined) mentorProfileData.experience = parseInt(experience) || 0

      await prisma.mentorProfile.upsert({
        where: { userId: id },
        update: mentorProfileData,
        create: {
          userId: id,
          bio: bio || '',
          expertise: expertise || '',
          experience: parseInt(experience) || 0,
        },
      })
    }

    // Update student profile if role is STUDENT
    if (role === 'STUDENT') {
      const studentProfileData: any = {}
      if (interests !== undefined) studentProfileData.interests = interests
      if (education !== undefined) studentProfileData.education = education

      await prisma.studentProfile.upsert({
        where: { userId: id },
        update: studentProfileData,
        create: {
          userId: id,
          interests: interests || '',
          education: education || '',
        },
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check for related records that would prevent deletion
    const [enrollments, payments, assignments, mentorAssignments] = await Promise.all([
      prisma.enrollment.count({ where: { studentId: id } }),
      prisma.payment.count({ where: { payerId: id } }),
      prisma.mentorAssignment.count({ where: { mentorId: id } }),
      prisma.mentorAssignment.count({ where: { studentId: id } })
    ])

    const totalRelatedRecords = enrollments + payments + assignments + mentorAssignments

    if (totalRelatedRecords > 0) {
      let errorMessage = 'Cannot delete user because they have related records:'
      const issues = []
      
      if (enrollments > 0) issues.push(`${enrollments} enrollment(s)`)
      if (payments > 0) issues.push(`${payments} payment(s)`)
      if (assignments > 0) issues.push(`${assignments} mentor assignment(s)`)
      if (mentorAssignments > 0) issues.push(`${mentorAssignments} student assignment(s)`)
      
      errorMessage += ' ' + issues.join(', ') + '. Please remove these records first or deactivate the user instead.'
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
