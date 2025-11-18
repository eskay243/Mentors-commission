import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { sendEmail, emailTemplates } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

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

    // Create Stripe Payment Intent
    let stripePaymentIntent
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        stripePaymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'ngn', // Nigerian Naira - adjust as needed
          description: description || `Payment for ${enrollment.course.title}`,
          metadata: {
            enrollmentId,
            paymentId: payment.id,
            studentId: session.user.id,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        })

        // Update payment with Stripe Payment Intent ID
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            stripePaymentId: stripePaymentIntent.id,
          },
        })

        return NextResponse.json(
          {
            ...payment,
            stripePaymentId: stripePaymentIntent.id,
            clientSecret: stripePaymentIntent.client_secret,
          },
          { status: 201 }
        )
      } else {
        // Fallback: Simulate payment if Stripe is not configured
        console.warn('Stripe not configured, simulating payment')
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
        }, 2000)

        return NextResponse.json(payment, { status: 201 })
      }
    } catch (stripeError) {
      console.error('Stripe error:', stripeError)
      // If Stripe fails, keep payment as PENDING
      return NextResponse.json(
        {
          ...payment,
          error: 'Payment processing failed. Please try again.',
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
