import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfillPayments() {
  console.log('Starting payment backfill process...')
  
  try {
    // Find enrollments that have paid amounts but no payment records
    const enrollmentsWithPayments = await prisma.enrollment.findMany({
      where: {
        paidAmount: {
          gt: 0,
        },
      },
      include: {
        payments: true,
        student: true,
        course: true,
      },
    })

    console.log(`Found ${enrollmentsWithPayments.length} enrollments with paid amounts`)

    let createdPayments = 0
    let skippedPayments = 0

    for (const enrollment of enrollmentsWithPayments) {
      // Check if payment records already exist for this enrollment
      if (enrollment.payments.length > 0) {
        console.log(`Skipping enrollment ${enrollment.id} - already has ${enrollment.payments.length} payment(s)`)
        skippedPayments++
        continue
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          enrollmentId: enrollment.id,
          amount: enrollment.paidAmount,
          status: 'COMPLETED',
          paidAt: enrollment.createdAt, // Use enrollment creation date as payment date
          payerId: enrollment.studentId,
          description: `Enrollment payment for ${enrollment.course.title}`,
        },
      })

      console.log(`Created payment ${payment.id} for enrollment ${enrollment.id} - Amount: ₦${enrollment.paidAmount}`)
      createdPayments++
    }

    console.log('\n=== Backfill Summary ===')
    console.log(`Total enrollments processed: ${enrollmentsWithPayments.length}`)
    console.log(`Payments created: ${createdPayments}`)
    console.log(`Payments skipped (already exist): ${skippedPayments}`)
    
    // Calculate new total revenue
    const totalRevenueFromPayments = await prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    })

    const totalRevenueFromEnrollments = await prisma.enrollment.aggregate({
      _sum: { paidAmount: true },
    })

    const totalRevenue = (totalRevenueFromPayments._sum.amount || 0) + (totalRevenueFromEnrollments._sum.paidAmount || 0)
    
    console.log(`New total revenue: ₦${totalRevenue.toLocaleString()}`)
    console.log('\nPayment backfill completed successfully!')

  } catch (error) {
    console.error('Error during payment backfill:', error)
  } finally {
    await prisma.$disconnect()
  }
}

backfillPayments()
