import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import StudentReceiptsClient from './StudentReceiptsClient'

export default async function StudentReceipts() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    redirect('/auth/signin')
  }

  // Fetch all payments for the student
  const payments = await prisma.payment.findMany({
    where: {
      payerId: session.user.id,
      status: 'COMPLETED',
    },
    include: {
      enrollment: {
        include: {
          course: true,
        },
      },
      assignment: {
        include: {
          mentor: true,
        },
      },
    },
    orderBy: { paidAt: 'desc' },
  })

  // Transform payments to receipt format
  const receipts = payments.map(payment => ({
    id: payment.id,
    type: 'payment' as const,
    amount: payment.amount,
    description: payment.description || `Payment for ${payment.enrollment.course.title}`,
    date: payment.paidAt ? payment.paidAt.toLocaleDateString() : payment.createdAt.toLocaleDateString(),
    status: payment.status,
    reference: payment.stripePaymentId || payment.id,
    course: payment.enrollment.course.title,
    mentor: payment.assignment?.mentor?.name ?? undefined,
  }))

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment Receipts</h1>
          <p className="text-gray-600">View and download your payment receipts</p>
        </div>

        <StudentReceiptsClient receipts={receipts} />
      </div>
    </Layout>
  )
}
