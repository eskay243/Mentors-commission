import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { Plus, BookOpen, Users, Calendar, DollarSign } from 'lucide-react'
import EnrollmentActionButtons from '@/components/EnrollmentActionButtons'

export default async function AdminEnrollments() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // Get enrollments with related data
  const enrollments = await prisma.enrollment.findMany({
    include: {
      student: {
        include: {
          studentProfile: true,
        },
      },
      course: true,
      payments: true,
      assignments: {
        include: {
          mentor: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get stats
  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'ACTIVE').length,
    completed: enrollments.filter(e => e.status === 'COMPLETED').length,
    totalRevenue: enrollments.reduce((sum, e) => sum + e.paidAmount, 0),
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Course Enrollments</h1>
            <p className="text-gray-600">Students who have paid and enrolled in courses. Next step: assign mentors to enrolled students.</p>
          </div>
          <Link href="/admin/enrollments/new" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Enroll Student
          </Link>
        </div>

        {/* Workflow Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Workflow Guide</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p><strong>Step 1:</strong> Enroll students in courses (this page) - Students pay fees and get access to course content.</p>
                <p><strong>Step 2:</strong> Go to <Link href="/admin/assignments" className="font-medium underline hover:text-blue-800">Mentor Assignments</Link> to assign mentors to enrolled students - Mentors receive commission from student payments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {enrollments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by enrolling a student in a course.
              </p>
              <div className="mt-6">
                <Link href="/admin/enrollments/new" className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll Student
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    {/* Enrollment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-700">
                              {enrollment.student.name 
                                ? enrollment.student.name.charAt(0).toUpperCase() 
                                : enrollment.student.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {enrollment.student.name || 'No name'}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{enrollment.student.email}</p>
                        </div>
                      </div>
                      
                      {/* Course Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Course</span>
                          <p className="text-sm font-semibold text-gray-900 truncate">{enrollment.course.title}</p>
                          <p className="text-xs text-gray-500">{enrollment.course.level} • {enrollment.course.duration} days</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Amount</span>
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(enrollment.totalAmount)}</p>
                          <p className="text-xs text-gray-500">Paid: {formatCurrency(enrollment.payments.reduce((sum, payment) => sum + payment.amount, 0))}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Date</span>
                          <p className="text-sm font-semibold text-gray-900">{enrollment.startDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(enrollment.status)}`}>
                              {enrollment.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mentor Assignment */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">Mentor:</span>
                          {enrollment.assignments.length > 0 ? (
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {enrollment.assignments[0].mentor.name || enrollment.assignments[0].mentor.email}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({enrollment.assignments[0].commission}% commission)
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-red-500 italic">No mentor assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Always Visible */}
                    <div className="flex-shrink-0 ml-4">
                      <EnrollmentActionButtons
                        enrollmentId={enrollment.id}
                        enrollmentData={{
                          student: enrollment.student,
                          course: enrollment.course
                        }}
                        hasAssignment={enrollment.assignments.length > 0}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
