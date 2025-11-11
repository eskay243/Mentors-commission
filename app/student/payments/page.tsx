import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default async function StudentPayments() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    redirect('/auth/signin')
  }

  // Fetch payment data for the student
  const [
    totalPaid,
    pendingPayments,
    completedPayments,
    payments,
    enrollments,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        payerId: session.user.id,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
    prisma.payment.count({
      where: {
        payerId: session.user.id,
        status: 'PENDING',
      },
    }),
    prisma.payment.count({
      where: {
        payerId: session.user.id,
        status: 'COMPLETED',
      },
    }),
    prisma.payment.findMany({
      where: {
        payerId: session.user.id,
      },
      include: {
        enrollment: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.enrollment.findMany({
      where: { studentId: session.user.id },
      include: {
        course: true,
        payments: true,
      },
    }),
  ])

  const stats = [
    {
      name: 'Total Paid',
      value: `₦${totalPaid._sum.amount?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Pending Payments',
      value: pendingPayments,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Completed Payments',
      value: completedPayments,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Active Enrollments',
      value: enrollments.filter(e => e.status === 'ACTIVE').length,
      icon: AlertCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'REFUNDED':
        return <DollarSign className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const calculatePaymentProgress = (enrollment: any) => {
    const totalAmount = enrollment.totalAmount
    const paidAmount = enrollment.payments
      .filter((p: any) => p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + p.amount, 0)
    return {
      paid: paidAmount,
      remaining: totalAmount - paidAmount,
      percentage: (paidAmount / totalAmount) * 100,
    }
  }

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600">Track your course payments and invoices</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Course Payment Progress */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Progress</h2>
            <div className="space-y-4">
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => {
                  const progress = calculatePaymentProgress(enrollment)
                  return (
                    <div key={enrollment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{enrollment.course.title}</h3>
                        <span className="text-sm font-medium text-gray-900">
                          ₦{progress.paid.toFixed(2)} / ₦{enrollment.totalAmount}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Payment Progress</span>
                          <span>{progress.percentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        {progress.remaining > 0 ? (
                          <span className="text-yellow-600">₦{progress.remaining.toFixed(2)} remaining</span>
                        ) : (
                          <span className="text-green-600">Fully paid</span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No enrollments found</p>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Course Fees</span>
                <span className="text-sm font-medium text-gray-900">
                  ₦{enrollments.reduce((sum, e) => sum + e.totalAmount, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Paid</span>
                <span className="text-sm font-medium text-green-600">
                  ₦{totalPaid._sum.amount?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending Payments</span>
                <span className="text-sm font-medium text-yellow-600">
                  ₦{enrollments.reduce((sum, e) => {
                    const paid = e.payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0)
                    return sum + (e.totalAmount - paid)
                  }, 0).toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Outstanding Balance</span>
                  <span className="text-sm font-semibold text-red-600">
                    ₦{enrollments.reduce((sum, e) => {
                      const paid = e.payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0)
                      return sum + Math.max(0, e.totalAmount - paid)
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.enrollment.course.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.description || 'Course payment'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₦{payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(payment.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.createdAt.toLocaleDateString()}
                      {payment.paidAt && (
                        <div className="text-xs text-gray-400">
                          Paid: {payment.paidAt.toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-800">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Yet</h3>
              <p className="text-gray-600">
                You haven't made any payments yet. Payments will appear here once you enroll in courses and make payments.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
