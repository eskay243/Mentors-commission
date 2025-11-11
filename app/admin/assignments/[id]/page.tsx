import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, User, BookOpen, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AssignmentDetailProps {
  params: { id: string }
}

export default async function AssignmentDetail({ params }: AssignmentDetailProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const assignment = await prisma.mentorAssignment.findUnique({
    where: { id: params.id },
    include: {
      mentor: true,
      student: true,
      course: true,
      enrollment: true,
      payments: {
        include: {
          payer: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!assignment) {
    notFound()
  }

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

  const totalEarnings = assignment.payments.reduce((sum, payment) => sum + (payment.mentorCommission || 0), 0)
  const totalPayments = assignment.payments.length

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/admin/assignments" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Assignments
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assignment Details</h1>
              <p className="text-gray-600 mt-1">
                {assignment.mentor.name} → {assignment.student.name} • {assignment.course.title}
              </p>
            </div>
            <Link
              href={`/admin/assignments/${assignment.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Assignment
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Assignment Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Overview */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Assignment Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mentor Info */}
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-2xl font-medium text-blue-600">
                        {assignment.mentor.name?.charAt(0).toUpperCase() || 'M'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Mentor</h3>
                    <p className="text-lg font-semibold text-gray-900">{assignment.mentor.name}</p>
                    <p className="text-sm text-gray-500">{assignment.mentor.email}</p>
                  </div>
                </div>

                {/* Student Info */}
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-2xl font-medium text-green-600">
                        {assignment.student.name?.charAt(0).toUpperCase() || 'S'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Student</h3>
                    <p className="text-lg font-semibold text-gray-900">{assignment.student.name}</p>
                    <p className="text-sm text-gray-500">{assignment.student.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Course Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Course</h3>
                  <p className="text-lg font-semibold text-gray-900">{assignment.course.title}</p>
                  <p className="text-sm text-gray-500">{assignment.course.level} • {assignment.course.category}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Course Price</h3>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(assignment.course.price)}</p>
                  <p className="text-sm text-gray-500">{assignment.course.duration} days</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Enrollment Amount</h3>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(assignment.enrollment.totalAmount)}</p>
                  <p className="text-sm text-gray-500">Paid: {formatCurrency(assignment.enrollment.paidAmount)}</p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {assignment.payments.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Payment History</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignment.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.createdAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.mentorCommission || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Assignment Stats</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-yellow-100 rounded-md flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Commission Rate</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{assignment.commission}%</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-md flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Total Earnings</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalEarnings)}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Total Payments</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{totalPayments}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Status</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Assignment Timeline */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Timeline</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Assignment Created</p>
                  <p className="text-sm text-gray-500">{assignment.assignedAt.toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Updated</p>
                  <p className="text-sm text-gray-500">{assignment.updatedAt.toLocaleString()}</p>
                </div>
                
                {assignment.enrollment.startDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enrollment Start</p>
                    <p className="text-sm text-gray-500">{assignment.enrollment.startDate.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
