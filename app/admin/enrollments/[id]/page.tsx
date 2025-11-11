import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, Edit, User, BookOpen, DollarSign, Calendar, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface EnrollmentDetailPageProps {
  params: {
    id: string
  }
}

export default async function EnrollmentDetailPage({ params }: EnrollmentDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const { id } = params

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
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Enrollment Not Found</h1>
          <p className="text-gray-600 mb-8">The enrollment you are looking for does not exist.</p>
          <Link href="/admin/enrollments" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Enrollments
          </Link>
        </div>
      </Layout>
    )
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalPaid = enrollment.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingAmount = enrollment.totalAmount - totalPaid

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrollment Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              Detailed view of enrollment for {enrollment.student.name}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Link href="/admin/enrollments" className="btn btn-secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Link>
            <Link href={`/admin/enrollments/${enrollment.id}/edit`} className="btn btn-primary">
              <Edit className="h-4 w-4 mr-2" />
              Edit Enrollment
            </Link>
          </div>
        </div>

        {/* Enrollment Overview */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Student</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{enrollment.student.name}</p>
              <p className="text-sm text-gray-500">{enrollment.student.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Course</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{enrollment.course.title}</p>
              <p className="text-sm text-gray-500">{enrollment.course.level} • {enrollment.course.duration} days</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(enrollment.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Amount Paid</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(totalPaid)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Remaining Amount</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(remainingAmount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <div className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(enrollment.status)}`}>
                  {enrollment.status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{enrollment.startDate.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created At</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{enrollment.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Mentor Assignment */}
        {enrollment.assignments.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mentor Assignment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Mentor</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {enrollment.assignments[0].mentor.name}
                </p>
                <p className="text-sm text-gray-500">{enrollment.assignments[0].mentor.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Commission Rate</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {enrollment.assignments[0].commission}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expected Commission</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency((enrollment.totalAmount * enrollment.assignments[0].commission) / 100)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link 
                href={`/admin/assignments/${enrollment.assignments[0].id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <User className="h-4 w-4 mr-2" />
                View Assignment Details
              </Link>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
          {enrollment.payments.length === 0 ? (
            <p className="text-gray-500">No payments recorded for this enrollment yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollment.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.paidAt ? payment.paidAt.toLocaleDateString() : 'Not paid'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadgeColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
