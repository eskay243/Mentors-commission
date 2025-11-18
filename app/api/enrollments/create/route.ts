import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentId, courseId, totalAmount, paidAmount = 0, status = 'ACTIVE', discountAdjustment } = await request.json()

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: 'Student ID and Course ID are required' },
        { status: 400 }
      )
    }

    // Verify student and course exist
    const [student, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId, role: 'STUDENT' } }),
      prisma.course.findUnique({ where: { id: courseId } }),
    ])

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this course' },
        { status: 400 }
      )
    }

    // Use course price if totalAmount not provided
    const enrollmentAmount = totalAmount || course.price

    // Create the enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        status,
        startDate: new Date(),
        endDate: new Date(Date.now() + course.duration * 24 * 60 * 60 * 1000), // Add duration in days
        totalAmount: enrollmentAmount,
        paidAmount,
      },
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
        course: true,
      },
    })

    // Create payment record if there's a paid amount
    let payment = null
    if (paidAmount > 0) {
      // Calculate mentor commission (37%) and platform fee (3%)
      const mentorCommission = paidAmount * 0.37
      const platformFee = paidAmount * 0.03
      
      payment = await prisma.payment.create({
        data: {
          enrollmentId: enrollment.id,
          amount: paidAmount,
          mentorCommission,
          platformFee,
          status: 'COMPLETED',
          paidAt: new Date(),
          payerId: studentId,
          description: `Enrollment payment for ${course.title}`,
        },
      })
    }

    // Send enrollment confirmation email
    try {
      if (student.email) {
        const template = emailTemplates.enrollmentConfirmed(
          student.name || student.email,
          course.title
        )
        await sendEmail({
          to: student.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
      }
    } catch (emailError) {
      console.error('Error sending enrollment email:', emailError)
      // Don't fail the enrollment if email fails
    }

    return NextResponse.json({
      success: true,
      enrollment,
      payment,
      message: `Student ${student.name || student.email} enrolled in ${course.title} successfully`,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating enrollment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
