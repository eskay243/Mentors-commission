import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { Users, BookOpen, DollarSign, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // Fetch dashboard statistics
  const [
    totalUsers,
    totalStudents,
    totalMentors,
    totalCourses,
    totalEnrollments,
    totalRevenueFromPayments,
    monthlyRevenueFromPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'MENTOR' } }),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
  ])

  // Calculate total revenue - use payments as primary source to avoid double-counting
  // If an enrollment has payments, use those; otherwise use enrollment paidAmount
  const enrollmentsWithoutPayments = await prisma.enrollment.findMany({
    where: {
      paidAmount: { gt: 0 },
      payments: {
        none: {},
      },
    },
  })

  const revenueFromEnrollmentsWithoutPayments = enrollmentsWithoutPayments.reduce(
    (sum, enrollment) => sum + enrollment.paidAmount,
    0
  )

  const totalRevenue = (totalRevenueFromPayments._sum.amount || 0) + revenueFromEnrollmentsWithoutPayments
  const monthlyRevenue = monthlyRevenueFromPayments._sum.amount || 0

  const recentEnrollments = await prisma.enrollment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      student: true,
      course: true,
    },
  })

  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      payer: true,
      enrollment: {
        include: {
          course: true,
        },
      },
    },
  })

  const stats = [
    {
      name: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Students',
      value: totalStudents,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Mentors',
      value: totalMentors,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Courses',
      value: totalCourses,
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: 'Enrollments',
      value: totalEnrollments,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      name: 'Total Revenue',
      value: `₦${totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ]

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Enrollments */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Enrollments</h2>
            <div className="space-y-3">
              {recentEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{enrollment.student.name}</p>
                    <p className="text-sm text-gray-600">{enrollment.course.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">₦{enrollment.totalAmount}</p>
                    <p className="text-xs text-gray-500">
                      {enrollment.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h2>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.payer.name}</p>
                    <p className="text-sm text-gray-600">{payment.enrollment.course.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">₦{payment.amount}</p>
                    <p className="text-xs text-gray-500">
                      {payment.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Revenue Chart Placeholder */}
        <div className="mt-8">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart component would go here</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
