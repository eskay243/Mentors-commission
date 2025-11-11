import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, Edit, Users, BookOpen, DollarSign, Calendar, Tag } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default async function CourseDetail({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      createdBy: true,
      enrollments: {
        include: {
          student: {
            include: {
              studentProfile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      assignments: {
        include: {
          mentor: true,
          student: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          assignments: true,
        },
      },
    },
  })

  if (!course) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
            <Link href="/admin/courses" className="btn btn-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  const getStatusBadgeColor = (status: string) => {
    return status === 'ACTIVE' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/courses"
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Link>
          </div>
          <Link
            href={`/admin/courses/${course.id}/edit`}
            className="btn btn-primary"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </Link>
        </div>

        {/* Course Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(course.isActive ? 'ACTIVE' : 'INACTIVE')}`}>
                  {course.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-600 text-lg mb-4">{course.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-gray-600">Price:</span>
                  <span className="ml-2 font-semibold">{formatCurrency(course.price)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-semibold">{course.duration} days</span>
                </div>
                <div className="flex items-center text-sm">
                  <Tag className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-gray-600">Level:</span>
                  <span className="ml-2 font-semibold">{course.level}</span>
                </div>
                <div className="flex items-center text-sm">
                  <BookOpen className="h-4 w-4 text-orange-600 mr-2" />
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-2 font-semibold">{course.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{course._count.enrollments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mentor Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{course._count.assignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Potential Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(course.price * course._count.enrollments)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Student Enrollments</h3>
          </div>
          <div className="overflow-x-auto">
            {course.enrollments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollments yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Students haven't enrolled in this course yet.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {course.enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {enrollment.student.name 
                                  ? enrollment.student.name.charAt(0).toUpperCase() 
                                  : enrollment.student.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {enrollment.student.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{enrollment.student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(enrollment.status)}`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{formatCurrency(enrollment.totalAmount)}</div>
                          <div className="text-xs text-gray-500">
                            Paid: {formatCurrency(enrollment.paidAmount)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {enrollment.startDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const assignment = course.assignments.find(a => a.enrollmentId === enrollment.id)
                          return assignment ? (
                            <div>
                              <div className="font-medium">
                                {assignment.mentor.name || assignment.mentor.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                {assignment.commission}% commission
                              </div>
                            </div>
                          ) : (
                            <span className="text-red-500 italic">No mentor assigned</span>
                          )
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Course Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Course Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Created By</h4>
              <p className="text-sm text-gray-900">
                {course.createdBy.name || course.createdBy.email}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Created Date</h4>
              <p className="text-sm text-gray-900">
                {course.createdAt.toLocaleDateString()} at {course.createdAt.toLocaleTimeString()}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h4>
              <p className="text-sm text-gray-900">
                {course.updatedAt.toLocaleDateString()} at {course.updatedAt.toLocaleTimeString()}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Course ID</h4>
              <p className="text-sm text-gray-900 font-mono">{course.id}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
