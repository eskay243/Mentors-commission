import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enrollmentId, amount, description } = await request.json()

    if (!enrollmentId || !amount) {
      return NextResponse.json(
        { error: 'Enrollment ID and amount are required' },
        { status: 400 }
      )
    }

    // Verify the enrollment belongs to the current user
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        studentId: session.user.id,
      },
      include: {
        course: true,
        assignments: {
          include: {
            mentor: true,
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Check if payment amount is valid
    const totalPaid = await prisma.payment.aggregate({
      where: {
        enrollmentId,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    })

    const remainingAmount = enrollment.totalAmount - (totalPaid._sum.amount || 0)
    
    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: `Payment amount cannot exceed remaining balance of ₦${remainingAmount.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Calculate mentor commission (37%)
    const mentorCommission = amount * 0.37
    const platformFee = amount * 0.03 // 3% platform fee

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        enrollmentId,
        amount,
        mentorCommission,
        platformFee,
        status: 'PENDING',
        description: description || `Payment for ${enrollment.course.title}`,
        payerId: session.user.id,
        assignmentId: enrollment.assignments[0]?.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      include: {
        enrollment: {
          include: {
            course: true,
            student: true,
          },
        },
        assignment: {
          include: {
            mentor: true,
          },
        },
      },
    })

    // In a real application, you would integrate with Stripe here
    // For demo purposes, we'll simulate a successful payment after a delay
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
            stripePaymentId: `pi_demo_${payment.id}`,
          },
        })

        // Update enrollment paid amount
        const newPaidAmount = (totalPaid._sum.amount || 0) + amount
        await prisma.enrollment.update({
          where: { id: enrollmentId },
          data: {
            paidAmount: newPaidAmount,
            status: newPaidAmount >= enrollment.totalAmount ? 'COMPLETED' : 'ACTIVE',
          },
        })
      } catch (error) {
        console.error('Error updating payment status:', error)
      }
    }, 2000) // 2 second delay to simulate processing

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
