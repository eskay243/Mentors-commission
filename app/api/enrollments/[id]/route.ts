import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/enrollments/[id] - Get a specific enrollment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
        course: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
        assignments: {
          include: {
            mentor: true,
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 })
    }

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error('Error fetching enrollment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/enrollments/[id] - Update an enrollment
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const { totalAmount, paidAmount, status, startDate, discountAdjustment } = await request.json()

  try {
    // Get current enrollment to check existing payments
    const currentEnrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { payments: true, student: true, course: true }
    })

    if (!currentEnrollment) {
      return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 })
    }

    const newPaidAmount = parseFloat(paidAmount)
    const currentPaidAmount = currentEnrollment.payments.reduce((sum, payment) => sum + payment.amount, 0)

    // Start a transaction to update enrollment and manage payments
    const result = await prisma.$transaction(async (tx) => {
      // Update the enrollment
      const updatedEnrollment = await tx.enrollment.update({
        where: { id },
        data: {
          totalAmount: parseFloat(totalAmount),
          paidAmount: newPaidAmount,
          status,
          startDate: new Date(startDate),
        },
      })

      // Handle payment records based on the difference
      if (newPaidAmount > currentPaidAmount) {
        // Payment amount increased - create a new payment record for the difference
        const paymentDifference = newPaidAmount - currentPaidAmount
        const mentorCommission = paymentDifference * 0.37
        const platformFee = paymentDifference * 0.03
        
        await tx.payment.create({
          data: {
            enrollmentId: id,
            amount: paymentDifference,
            mentorCommission,
            platformFee,
            status: 'COMPLETED',
            paidAt: new Date(),
            payerId: currentEnrollment.studentId,
            description: `Payment update for ${currentEnrollment.course.title} - Additional payment`,
          },
        })
      } else if (newPaidAmount < currentPaidAmount) {
        // Payment amount decreased - we need to adjust existing payments
        // For simplicity, we'll delete all existing payments and create a new one
        await tx.payment.deleteMany({
          where: { enrollmentId: id }
        })
        
        if (newPaidAmount > 0) {
          const mentorCommission = newPaidAmount * 0.37
          const platformFee = newPaidAmount * 0.03
          
          await tx.payment.create({
            data: {
              enrollmentId: id,
              amount: newPaidAmount,
              mentorCommission,
              platformFee,
              status: 'COMPLETED',
              paidAt: new Date(),
              payerId: currentEnrollment.studentId,
              description: `Payment update for ${currentEnrollment.course.title} - Adjusted payment`,
            },
          })
        }
      }
      // If newPaidAmount === currentPaidAmount, no payment changes needed

      return updatedEnrollment
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating enrollment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/enrollments/[id] - Delete an enrollment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    // Check if there are any payments or assignments associated with this enrollment
    const [paymentsCount, assignmentsCount] = await Promise.all([
      prisma.payment.count({
        where: { enrollmentId: id }
      }),
      prisma.mentorAssignment.count({
        where: { enrollmentId: id }
      })
    ])

    if (paymentsCount > 0 || assignmentsCount > 0) {
      return NextResponse.json(
        { 
          message: `Cannot delete enrollment. It has ${paymentsCount} payment(s) and ${assignmentsCount} assignment(s). Please remove these dependencies first.` 
        }, 
        { status: 400 }
      )
    }

    await prisma.enrollment.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Enrollment deleted successfully' })
  } catch (error) {
    console.error('Error deleting enrollment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
