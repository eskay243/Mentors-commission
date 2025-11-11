import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { DollarSign, TrendingUp, Calendar, User } from 'lucide-react'

export default async function MentorPayments() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'MENTOR') {
    redirect('/auth/signin')
  }

  // Fetch payment data for the mentor
  const [
    totalEarnings,
    monthlyEarnings,
    payments,
    earningsByMonth,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        assignment: { mentorId: session.user.id },
        status: 'COMPLETED',
      },
      _sum: { mentorCommission: true },
    }),
    prisma.payment.aggregate({
      where: {
        assignment: { mentorId: session.user.id },
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { mentorCommission: true },
    }),
    prisma.payment.findMany({
      where: {
        assignment: { mentorId: session.user.id },
      },
      include: {
        payer: true,
        enrollment: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Get earnings by month for the last 6 months
    prisma.payment.findMany({
      where: {
        assignment: { mentorId: session.user.id },
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 months ago
        },
      },
      select: {
        createdAt: true,
        mentorCommission: true,
      },
    }),
  ])

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

  // Process earnings by month
  const monthlyEarningsData = earningsByMonth.map(payment => ({
    month: payment.createdAt.toISOString().substring(0, 7), // YYYY-MM format
    total: payment.mentorCommission || 0,
  }))

  const stats = [
    {
      name: 'Total Earnings',
      value: `₦${totalEarnings._sum.mentorCommission?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'This Month',
      value: `₦${monthlyEarnings._sum.mentorCommission?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total Payments',
      value: payments.length,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Commission Rate',
      value: '37%',
      icon: User,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600">Track your earnings and commission payments</p>
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
          {/* Earnings Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings</h2>
            <div className="space-y-3">
              {monthlyEarningsData.length > 0 ? (
                monthlyEarningsData.map((month) => (
                  <div key={month.month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      ₦{Number(month.total).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No earnings data available</p>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed Payments</span>
                <span className="text-sm font-medium text-gray-900">
                  {payments.filter(p => p.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending Payments</span>
                <span className="text-sm font-medium text-gray-900">
                  {payments.filter(p => p.status === 'PENDING').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Failed Payments</span>
                <span className="text-sm font-medium text-gray-900">
                  {payments.filter(p => p.status === 'FAILED').length}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Total Commission Earned</span>
                  <span className="text-sm font-semibold text-green-600">
                    ₦{totalEarnings._sum.mentorCommission?.toFixed(2) || '0.00'}
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
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-green-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-green-800">
                              {payment.payer.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{payment.payer.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.enrollment.course.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₦{payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₦{payment.mentorCommission?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.createdAt.toLocaleDateString()}
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
                You haven't received any payments yet. Payments will appear here once students make payments for your assigned courses.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
