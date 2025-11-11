import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { MessageSquare, Clock, Calendar, DollarSign, BookOpen, Users } from 'lucide-react'

export default async function MentorStudents() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'MENTOR') {
    redirect('/auth/signin')
  }

  const assignments = await prisma.mentorAssignment.findMany({
    where: { mentorId: session.user.id },
    include: {
      student: {
        include: {
          studentProfile: true,
        },
      },
      course: true,
      enrollment: {
        include: {
          payments: {
            where: { status: 'COMPLETED' },
          },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEnrollmentStatusBadgeColor = (status: string) => {
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

  const calculateDaysRemaining = (endDate: Date | null) => {
    if (!endDate) return 'Unknown'
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? `${diffDays} days` : 'Completed'
  }

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600">Manage your assigned students and track their progress</p>
        </div>

        <div className="space-y-6">
          {assignments.length > 0 ? (
            assignments.map((assignment) => {
              const totalPaid = assignment.enrollment.payments.reduce(
                (sum, payment) => sum + payment.amount,
                0
              )
              const mentorEarnings = assignment.enrollment.payments.reduce(
                (sum, payment) => sum + (payment.mentorCommission || 0),
                0
              )

              return (
                <div key={assignment.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-16 w-16">
                        <div className="h-16 w-16 rounded-full bg-green-300 flex items-center justify-center">
                          <span className="text-lg font-medium text-green-800">
                            {assignment.student.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.student.name}
                        </h3>
                        <p className="text-gray-600">{assignment.student.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(assignment.status)}`}>
                            {assignment.status}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEnrollmentStatusBadgeColor(assignment.enrollment.status)}`}>
                            {assignment.enrollment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MessageSquare className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="ml-2 text-sm font-medium text-gray-900">Course</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{assignment.course.title}</p>
                      <p className="text-xs text-gray-500">
                        Duration: {assignment.course.duration} days
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="ml-2 text-sm font-medium text-gray-900">Progress</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {calculateDaysRemaining(assignment.enrollment.endDate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Started: {assignment.enrollment.startDate.toLocaleDateString()}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="ml-2 text-sm font-medium text-gray-900">Earnings</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">${mentorEarnings.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {assignment.commission}% commission
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <span className="ml-2 text-sm font-medium text-gray-900">Assigned</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {assignment.assignedAt.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Total: ${assignment.enrollment.totalAmount}
                      </p>
                    </div>
                  </div>

                  {/* Student Profile Information */}
                  {assignment.student.studentProfile && (
                    <div className="mt-6 border-t pt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Student Profile</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Goals</label>
                          <p className="mt-1 text-sm text-gray-600">
                            {assignment.student.studentProfile.goals || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Level</label>
                          <p className="mt-1 text-sm text-gray-600">
                            {assignment.student.studentProfile.level || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Phone</label>
                          <p className="mt-1 text-sm text-gray-600">
                            {assignment.student.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="card text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Assigned</h3>
              <p className="text-gray-600">
                You don't have any students assigned to you yet. Contact an administrator to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
