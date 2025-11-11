import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import MentorReceiptsClient from './MentorReceiptsClient'

export default async function MentorReceipts() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'MENTOR') {
    redirect('/auth/signin')
  }

  // Fetch all commission payments for the mentor
  const payments = await prisma.payment.findMany({
    where: {
      assignment: {
        mentorId: session.user.id,
      },
      status: 'COMPLETED',
      mentorCommission: {
        gt: 0,
      },
    },
    include: {
      payer: true,
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
    orderBy: { createdAt: 'desc' },
  })

  // Transform payments to receipt format
  const receipts = payments.map(payment => ({
    id: payment.id,
    type: 'commission' as const,
    amount: payment.mentorCommission || 0,
    description: payment.description || `Commission for ${payment.enrollment.course.title}`,
    date: payment.createdAt.toLocaleDateString(),
    status: payment.status,
    reference: payment.stripePaymentId || payment.id,
    course: payment.enrollment.course.title,
    payer: payment.payer?.name ?? undefined,
    payee: payment.assignment?.mentor?.name ?? undefined,
    commission: payment.assignment?.commission,
  }))

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Commission Receipts</h1>
          <p className="text-gray-600">View and download your commission receipts</p>
        </div>

        <MentorReceiptsClient receipts={receipts} />
      </div>
    </Layout>
  )
}
