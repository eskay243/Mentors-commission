import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mentorId, enrollmentId, commissionRate = 37.0 } = await request.json()

    if (!mentorId || !enrollmentId) {
      return NextResponse.json(
        { error: 'Mentor ID and Enrollment ID are required' },
        { status: 400 }
      )
    }

    // Get enrollment details to extract studentId and courseId
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        course: true,
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const studentId = enrollment.studentId
    const courseId = enrollment.courseId

    // Verify all entities exist
    const [mentor, student, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: mentorId, role: 'MENTOR' } }),
      prisma.user.findUnique({ where: { id: studentId, role: 'STUDENT' } }),
      prisma.course.findUnique({ where: { id: courseId } }),
    ])

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 })
    }
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.mentorAssignment.findFirst({
      where: {
        mentorId,
        enrollmentId,
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment already exists for this mentor and enrollment' },
        { status: 400 }
      )
    }

    // Create the assignment
    const assignment = await prisma.mentorAssignment.create({
      data: {
        mentorId,
        studentId,
        courseId,
        enrollmentId,
        commission: commissionRate,
      },
      include: {
        mentor: true,
        student: true,
        course: true,
        enrollment: true,
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
