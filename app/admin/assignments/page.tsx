import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { Plus, Search, Filter, Calendar, User, BookOpen, TrendingUp } from 'lucide-react'
import AssignmentActionButtons from '@/components/AssignmentActionButtons'
import { formatCurrency } from '@/lib/utils'

interface SearchParams {
  page?: string
  search?: string
  status?: string
  mentor?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface AdminAssignmentsProps {
  searchParams: SearchParams
}

export default async function AdminAssignments({ searchParams }: AdminAssignmentsProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const page = parseInt(searchParams.page || '1')
  const limit = 10
  const skip = (page - 1) * limit

  // Build where clause for filtering
  const where: any = {}
  
  if (searchParams.search) {
    where.OR = [
      { mentor: { name: { contains: searchParams.search } } },
      { student: { name: { contains: searchParams.search } } },
      { course: { title: { contains: searchParams.search } } },
    ]
  }
  
  if (searchParams.status) {
    where.status = searchParams.status
  }

  // Build orderBy clause
  const orderBy: any = { assignedAt: 'desc' }
  if (searchParams.sortBy) {
    orderBy[searchParams.sortBy] = searchParams.sortOrder || 'desc'
  }

  const [assignments, totalCount] = await Promise.all([
    prisma.mentorAssignment.findMany({
      where,
      include: {
        mentor: true,
        student: true,
        course: true,
        enrollment: true,
        payments: {
          select: {
            mentorCommission: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.mentorAssignment.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / limit)

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mentor-Student Assignments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Mentors assigned to enrolled students for coaching. Mentors receive commission from student payments.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/admin/assignments/new" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Assign Mentor
            </Link>
          </div>
        </div>

        {/* Workflow Info Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <User className="h-5 w-5 text-green-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Workflow Guide</h3>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>Prerequisite:</strong> Students must first be enrolled in courses via <Link href="/admin/enrollments" className="font-medium underline hover:text-green-800">Student Enrollments</Link>.</p>
                <p><strong>Purpose:</strong> Assign mentors to enrolled students - Mentors get commission (typically 37%) from student payments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Assignments</dt>
                    <dd className="text-lg font-medium text-gray-900">{totalCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Assignments</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignments.filter(a => a.status === 'ACTIVE').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignments.filter(a => a.status === 'COMPLETED').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignments.filter(a => {
                        const now = new Date()
                        const assignmentDate = new Date(a.assignedAt)
                        return assignmentDate.getMonth() === now.getMonth() && 
                               assignmentDate.getFullYear() === now.getFullYear()
                      }).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  placeholder="Search mentors, students, or courses..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="assignedAt_desc">Newest First</option>
                <option value="assignedAt_asc">Oldest First</option>
                <option value="commission_desc">Commission High to Low</option>
                <option value="commission_asc">Commission Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a mentor assignment.
              </p>
              <div className="mt-6">
                <Link href="/admin/assignments/new" className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assignments.map((assignment) => {
                const totalEarnings = assignment.payments.reduce((sum, payment) => sum + (payment.mentorCommission || 0), 0)
                
                return (
                  <div key={assignment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      {/* Assignment Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-6 mb-4">
                          {/* Mentor */}
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-lg font-medium text-blue-600">
                                  {assignment.mentor.name?.charAt(0).toUpperCase() || 'M'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Mentor</h4>
                              <p className="text-sm font-semibold text-gray-900">{assignment.mentor.name}</p>
                              <p className="text-xs text-gray-500">{assignment.mentor.email}</p>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex-shrink-0">
                            <div className="text-gray-400">→</div>
                          </div>

                          {/* Student */}
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-lg font-medium text-green-600">
                                  {assignment.student.name?.charAt(0).toUpperCase() || 'S'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Student</h4>
                              <p className="text-sm font-semibold text-gray-900">{assignment.student.name}</p>
                              <p className="text-xs text-gray-500">{assignment.student.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Assignment Details */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Course</span>
                            <p className="text-sm font-semibold text-gray-900 truncate">{assignment.course.title}</p>
                            <p className="text-xs text-gray-500">{formatCurrency(assignment.enrollment.totalAmount)}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Commission</span>
                            <p className="text-sm font-semibold text-gray-900">{assignment.commission}%</p>
                            <p className="text-xs text-gray-500">{formatCurrency((assignment.enrollment.totalAmount * assignment.commission) / 100)}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Earnings</span>
                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalEarnings)}</p>
                            <p className="text-xs text-gray-500">{assignment.payments.length} payments</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
                            <div className="mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(assignment.status)}`}>
                                {assignment.status}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned</span>
                            <p className="text-sm font-semibold text-gray-900">{assignment.assignedAt.toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">{assignment.assignedAt.toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <AssignmentActionButtons 
                        assignmentId={assignment.id}
                        assignmentData={{
                          mentor: {
                            id: assignment.mentor.id,
                            name: assignment.mentor.name,
                            email: assignment.mentor.email
                          },
                          student: {
                            id: assignment.student.id,
                            name: assignment.student.name,
                            email: assignment.student.email
                          },
                          course: {
                            id: assignment.course.id,
                            title: assignment.course.title
                          }
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <Link
                href={`/admin/assignments?page=${page > 1 ? page - 1 : 1}`}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </Link>
              <Link
                href={`/admin/assignments?page=${page < totalPages ? page + 1 : totalPages}`}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </Link>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{skip + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(skip + limit, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`/admin/assignments?page=${pageNum}`}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } ${pageNum === 1 ? 'rounded-l-md' : ''} ${pageNum === totalPages ? 'rounded-r-md' : ''}`}
                    >
                      {pageNum}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
