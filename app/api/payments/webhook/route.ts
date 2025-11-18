import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailTemplates } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(paymentIntent)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailure(failedPayment)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const enrollmentId = paymentIntent.metadata?.enrollmentId
    const paymentId = paymentIntent.metadata?.paymentId

    if (!enrollmentId || !paymentId) {
      console.error('Missing metadata in payment intent')
      return
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        stripePaymentId: paymentIntent.id,
      },
    })

    // Get current paid amount
    const totalPaid = await prisma.payment.aggregate({
      where: {
        enrollmentId,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    })

    // Update enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    })

    if (enrollment) {
      const newPaidAmount = totalPaid._sum.amount || 0
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          paidAmount: newPaidAmount,
          status: newPaidAmount >= enrollment.totalAmount ? 'COMPLETED' : 'ACTIVE',
        },
      })

      // Send email notification
      const student = await prisma.user.findUnique({
        where: { id: enrollment.studentId },
        include: { enrollments: { include: { course: true } } },
      })

      if (student && student.email) {
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
        })

        if (payment) {
          const course = await prisma.course.findUnique({
            where: { id: enrollment.courseId },
          })

          if (course) {
            const template = emailTemplates.paymentReceived(
              student.name || student.email,
              payment.amount,
              course.title
            )
            await sendEmail({
              to: student.email,
              subject: template.subject,
              html: template.html,
              text: template.text,
            })
          }
        }
      }
    }

    console.log(`Payment ${paymentId} completed successfully`)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const paymentId = paymentIntent.metadata?.paymentId

    if (!paymentId) {
      console.error('Missing payment ID in metadata')
      return
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        stripePaymentId: paymentIntent.id,
      },
    })

    console.log(`Payment ${paymentId} failed`)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

