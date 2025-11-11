import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { BookOpen, User, DollarSign, Clock, Calendar, Receipt } from 'lucide-react'

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    redirect('/auth/signin')
  }

  // Fetch student-specific data
  const [
    studentProfile,
    enrollments,
    mentorAssignments,
    totalPaid,
    nextPayment,
  ] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    }),
    prisma.enrollment.findMany({
      where: { studentId: session.user.id },
      include: {
        course: true,
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.mentorAssignment.findMany({
      where: { studentId: session.user.id, status: 'ACTIVE' },
      include: {
        mentor: {
          include: {
            mentorProfile: true,
          },
        },
        course: true,
      },
    }),
    prisma.payment.aggregate({
      where: {
        payerId: session.user.id,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
    prisma.payment.findFirst({
      where: {
        payerId: session.user.id,
        status: 'PENDING',
      },
      include: {
        enrollment: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    }),
  ])

  const stats = [
    {
      name: 'Enrolled Courses',
      value: enrollments.length,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'My Mentors',
      value: mentorAssignments.length,
      icon: User,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Total Paid',
      value: `₦${totalPaid._sum.amount?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Active Enrollments',
      value: enrollments.filter(e => e.status === 'ACTIVE').length,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateProgress = (enrollment: any) => {
    if (!enrollment.endDate) return 0
    const start = new Date(enrollment.startDate)
    const end = new Date(enrollment.endDate)
    const now = new Date()
    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    return Math.min(Math.max((elapsed / total) * 100, 0), 100)
  }

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session.user.name}</p>
            </div>
            <a
              href="/student/receipts"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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

        {/* Next Payment Alert */}
        {nextPayment && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Upcoming Payment</h3>
                <p className="text-sm text-blue-700">
                  You have a payment of ₦{nextPayment.amount} due for {nextPayment.enrollment.course.title}
                  {nextPayment.dueDate && ` by ${nextPayment.dueDate.toLocaleDateString()}`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Courses */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h2>
            <div className="space-y-4">
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{enrollment.course.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{enrollment.course.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{calculateProgress(enrollment).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress(enrollment)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium ml-1">₦{enrollment.totalAmount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Paid:</span>
                        <span className="font-medium ml-1">
                          ₦{enrollment.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Yet</h3>
                  <p className="text-gray-600">
                    You haven't enrolled in any courses yet. Browse available courses to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* My Mentors */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Mentors</h2>
            <div className="space-y-4">
              {mentorAssignments.length > 0 ? (
                mentorAssignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-blue-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800">
                            {assignment.mentor.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{assignment.mentor.name}</h3>
                        <p className="text-sm text-gray-600">{assignment.course.title}</p>
                        {assignment.mentor.mentorProfile && (
                          <p className="text-xs text-gray-500">
                            {assignment.mentor.mentorProfile.experience} years experience
                          </p>
                        )}
                      </div>
                    </div>
                    {assignment.mentor.mentorProfile?.bio && (
                      <p className="mt-2 text-sm text-gray-600">{assignment.mentor.mentorProfile.bio}</p>
                    )}
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Assigned: {assignment.assignedAt.toLocaleDateString()}
                      </span>
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        Send Message
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Mentors Assigned</h3>
                  <p className="text-gray-600">
                    You don't have any mentors assigned yet. Mentors will be assigned when you enroll in courses.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Profile */}
        {studentProfile && (
          <div className="mt-8">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">My Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Learning Goals</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {studentProfile.goals || 'No goals specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Level</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {studentProfile.level || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
