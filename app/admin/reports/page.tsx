import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { FileText, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Download } from 'lucide-react'

export default async function AdminReports() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // Get comprehensive financial data
  const [
    totalRevenue,
    totalExpenses,
    mentorCommissions,
    platformFees,
    monthlyRevenue,
    monthlyExpenses,
    mentorEarnings,
    courseRevenue,
    paymentStats,
    userStats,
    // Get expenses data
    totalExpenseAmount,
    expenseByStatus,
    expenseByCategory,
  ] = await Promise.all([
    // Total Revenue
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    }),
    
    // Total Expenses (Mentor Commissions)
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { mentorCommission: true },
    }),
    
    // Mentor Commissions by Mentor
    prisma.payment.groupBy({
      by: ['assignmentId'],
      where: { status: 'COMPLETED' },
      _sum: { mentorCommission: true },
      _count: true,
    }),
    
    // Platform Fees
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { platformFee: true },
    }),
    
    // Monthly Revenue (last 12 months)
    prisma.$queryRaw<Array<{ month: string; revenue: number; transactions: number }>>(Prisma.sql`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM Payment 
      WHERE status = 'COMPLETED'
      AND createdAt >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month DESC
    `),
    
    // Monthly Expenses (last 12 months)
    prisma.$queryRaw<Array<{ month: string; expenses: number; platform_fees: number }>>(Prisma.sql`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        SUM(mentorCommission) as expenses,
        SUM(platformFee) as platform_fees
      FROM Payment 
      WHERE status = 'COMPLETED'
      AND createdAt >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month DESC
    `),
    
    // Mentor Earnings
    prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      include: {
        assignment: {
          include: {
            mentor: true,
          },
        },
      },
    }),
    
    // Course Revenue
    prisma.payment.groupBy({
      by: ['enrollmentId'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    }),
    
    // Payment Statistics
    prisma.payment.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true },
    }),
    
    // User Statistics
    prisma.user.groupBy({
      by: ['role'],
      _count: true,
    }),
    // Get expenses data
    prisma.expense.aggregate({
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: true,
    }),
  ])

  // Calculate profit margin
  const totalRevenueAmount = totalRevenue._sum.amount || 0
  const totalExpensesAmount = totalExpenses._sum.mentorCommission || 0
  const platformFeesAmount = platformFees._sum.platformFee || 0
  // Get operational expenses from the expense data
  const operationalExpenses = totalExpenseAmount._sum.amount || 0
  const netProfit = totalRevenueAmount - totalExpensesAmount - operationalExpenses
  const profitMargin = totalRevenueAmount > 0 ? (netProfit / totalRevenueAmount) * 100 : 0

  // Process mentor earnings
  const mentorEarningsMap = new Map()
  mentorEarnings.forEach(payment => {
    if (payment.assignment?.mentor) {
      const mentorId = payment.assignment.mentor.id
      const mentorName = payment.assignment.mentor.name
      const commission = payment.mentorCommission || 0
      
      if (mentorEarningsMap.has(mentorId)) {
        mentorEarningsMap.get(mentorId).total += commission
        mentorEarningsMap.get(mentorId).count += 1
      } else {
        mentorEarningsMap.set(mentorId, {
          name: mentorName,
          total: commission,
          count: 1,
        })
      }
    }
  })

  const topMentors = Array.from(mentorEarningsMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const stats = [
    {
      name: 'Total Revenue',
      value: `₦${totalRevenueAmount.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Total Expenses',
      value: `₦${totalExpensesAmount.toLocaleString()}`,
      change: '+8.2%',
      changeType: 'positive',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'Net Profit',
      value: `₦${netProfit.toLocaleString()}`,
      change: `${profitMargin.toFixed(1)}%`,
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Platform Fees',
      value: `₦${platformFeesAmount.toLocaleString()}`,
      change: '+5.1%',
      changeType: 'positive',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600">Comprehensive earnings and expenses analysis</p>
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-secondary flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </button>
            <button className="btn btn-primary flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Revenue vs Expenses */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue vs Expenses</h2>
            <div className="space-y-3">
              {monthlyRevenue.slice(0, 6).map((month, index) => {
                const expenseData = monthlyExpenses.find(e => e.month === month.month)
                const expenses = expenseData?.expenses || 0
                const profit = Number(month.revenue) - expenses
                
                return (
                  <div key={month.month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      <p className="text-xs text-gray-500">{month.transactions} transactions</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        ₦{Number(month.revenue).toLocaleString()}
                      </div>
                      <div className="text-xs text-red-600">
                        -₦{expenses.toLocaleString()}
                      </div>
                      <div className="text-xs font-medium text-gray-900">
                        Net: ₦{profit.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Breakdown</h2>
            <div className="space-y-3">
              {paymentStats.map((stat) => (
                <div key={stat.status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      stat.status === 'COMPLETED' ? 'bg-green-500' :
                      stat.status === 'PENDING' ? 'bg-yellow-500' :
                      stat.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {stat.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {stat._count} payments
                    </div>
                    <div className="text-xs text-gray-500">
                      ₦{(stat._sum.amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Mentors */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Mentors</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mentor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg per Payment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topMentors.map((mentor, index) => (
                  <tr key={mentor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-800">
                              {mentor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{mentor.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₦{mentor.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mentor.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₦{(mentor.total / mentor.count).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { category: 'OPERATIONAL', label: 'Operational', color: 'bg-blue-100 text-blue-800' },
              { category: 'MARKETING', label: 'Marketing', color: 'bg-purple-100 text-purple-800' },
              { category: 'INFRASTRUCTURE', label: 'Infrastructure', color: 'bg-green-100 text-green-800' },
              { category: 'PERSONNEL', label: 'Personnel', color: 'bg-orange-100 text-orange-800' },
            ].map((cat) => {
              const categoryData = expenseByCategory.find((e: any) => e.category === cat.category)
              const amount = categoryData?._sum?.amount || 0
              const count = categoryData?._count || 0
              
              return (
                <div key={cat.category} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cat.color}`}>
                      {cat.label}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    ₦{amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {count} expenses
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userStats.map((stat) => (
            <div key={stat.role} className="card text-center">
              <div className={`inline-flex p-3 rounded-lg ${
                stat.role === 'STUDENT' ? 'bg-green-100' :
                stat.role === 'MENTOR' ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
                <Users className={`h-6 w-6 ${
                  stat.role === 'STUDENT' ? 'text-green-600' :
                  stat.role === 'MENTOR' ? 'text-blue-600' : 'text-purple-600'
                }`} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 capitalize">
                {stat.role.toLowerCase()}s
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat._count}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
