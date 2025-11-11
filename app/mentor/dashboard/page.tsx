import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { Users, DollarSign, TrendingUp, Clock, Receipt } from 'lucide-react'

export default async function MentorDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'MENTOR') {
    redirect('/auth/signin')
  }

  // Fetch mentor-specific data
  const [
    mentorProfile,
    assignedStudents,
    allEnrollments,
    monthlyEnrollments,
    recentPayments,
  ] = await Promise.all([
    prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    }),
    prisma.mentorAssignment.findMany({
      where: { mentorId: session.user.id, status: 'ACTIVE' },
      include: {
        student: true,
        course: true,
        enrollment: true,
      },
    }),
    // Get all enrollments for students assigned to this mentor
    prisma.enrollment.findMany({
      where: {
        assignments: {
          some: {
            mentorId: session.user.id,
          },
        },
      },
      include: {
        payments: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    }),
    // Get monthly enrollments for students assigned to this mentor
    prisma.enrollment.findMany({
      where: {
        assignments: {
          some: {
            mentorId: session.user.id,
          },
        },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      include: {
        payments: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
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
      take: 5,
    }),
  ])

  // Calculate total and monthly earnings from payments
  const totalEarnings = allEnrollments.reduce((sum, enrollment) => {
    return sum + enrollment.payments.reduce((paymentSum, payment) => {
      return paymentSum + (payment.mentorCommission || 0)
    }, 0)
  }, 0)

  const monthlyEarnings = monthlyEnrollments.reduce((sum, enrollment) => {
    return sum + enrollment.payments.reduce((paymentSum, payment) => {
      return paymentSum + (payment.mentorCommission || 0)
    }, 0)
  }, 0)

  const stats = [
    {
      name: 'Assigned Students',
      value: assignedStudents.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total Earnings',
      value: `₦${totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'This Month',
      value: `₦${monthlyEarnings.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Commission Rate',
      value: '37%',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session.user.name}</p>
            </div>
            <a
              href="/mentor/receipts"
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Receipt className="h-4 w-4" />
              <span>View Receipts</span>
            </a>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assigned Students */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Students</h2>
            <div className="space-y-3">
              {assignedStudents.length > 0 ? (
                assignedStudents.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-green-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-800">
                            {assignment.student.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{assignment.student.name}</p>
                        <p className="text-sm text-gray-600">{assignment.course.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {assignment.commission}% commission
                      </p>
                      <p className="text-xs text-gray-500">
                        Since {assignment.assignedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No students assigned yet</p>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h2>
            <div className="space-y-3">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{payment.payer.name}</p>
                      <p className="text-sm text-gray-600">{payment.enrollment.course.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ₦{payment.mentorCommission || '0.00'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No payments yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Mentor Profile */}
        <div className="mt-8">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <p className="mt-1 text-sm text-gray-900">
                  {mentorProfile?.bio || 'No bio provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Experience</label>
                <p className="mt-1 text-sm text-gray-900">
                  {mentorProfile?.experience || 0} years
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expertise</label>
                <p className="mt-1 text-sm text-gray-900">
                  {mentorProfile?.expertise || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <p className="mt-1 text-sm text-gray-900">
                  {mentorProfile?.rating || 0}/5.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
