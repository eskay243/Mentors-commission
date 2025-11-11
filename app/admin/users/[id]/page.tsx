import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Users, BookOpen, Award, Star } from 'lucide-react'

interface UserDetailsPageProps {
  params: {
    id: string
  }
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      mentorProfile: true,
      studentProfile: true,
      enrollments: {
        include: {
          course: true,
          payments: true,
        },
      },
      mentorAssignments: {
        include: {
          student: true,
          course: true,
          enrollment: {
            include: {
              payments: true,
            },
          },
        },
      },
      studentAssignments: {
        include: {
          mentor: true,
          course: true,
          enrollment: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          mentorAssignments: true,
          studentAssignments: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/admin/users')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'MENTOR':
        return 'bg-blue-100 text-blue-800'
      case 'STUDENT':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalSpent = user.enrollments.reduce((sum, enrollment) => {
    return sum + enrollment.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
  }, 0)

  const totalEarned = user.mentorAssignments.reduce((sum, assignment) => {
    return sum + assignment.enrollment.payments.reduce((paymentSum, payment) => {
      return paymentSum + (payment.mentorCommission || 0)
    }, 0)
  }, 0)

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/users"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600">View user information and activity</p>
            </div>
          </div>
          <Link href={`/admin/users/${user.id}/edit`} className="btn btn-primary">
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-lg text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-lg text-gray-900">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                {user.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-lg text-gray-900">{user.address}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Joined</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-lg text-gray-900">{user.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            {user.mentorProfile && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Mentor Profile
                </h2>
                <div className="space-y-4">
                  {user.mentorProfile.bio && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Bio</label>
                      <p className="text-gray-900 mt-1">{user.mentorProfile.bio}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Expertise</label>
                      <p className="text-gray-900">{user.mentorProfile.expertise || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Experience</label>
                      <p className="text-gray-900">{user.mentorProfile.experience ? `${user.mentorProfile.experience} years` : 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Rating</label>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <p className="text-gray-900">{user.mentorProfile.rating?.toFixed(1) || 'No rating'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {user.studentProfile && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Student Profile
                </h2>
                <div className="space-y-4">
                  {user.studentProfile.interests && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Interests</label>
                      <p className="text-gray-900">{user.studentProfile.interests}</p>
                    </div>
                  )}
                  {user.studentProfile.education && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Education</label>
                      <p className="text-gray-900">{user.studentProfile.education}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                {user.role === 'STUDENT' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Enrollments</label>
                      <p className="text-2xl font-bold text-gray-900">{user._count.enrollments}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Spent</label>
                      <p className="text-2xl font-bold text-green-600">₦{totalSpent.toLocaleString()}</p>
                    </div>
                  </>
                )}
                {user.role === 'MENTOR' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Students Assigned</label>
                      <p className="text-2xl font-bold text-gray-900">{user._count.mentorAssignments}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Earned</label>
                      <p className="text-2xl font-bold text-green-600">₦{totalEarned.toLocaleString()}</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Status</label>
                  <p className="text-lg font-semibold text-green-600">Active</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href={`/admin/users/${user.id}/edit`} className="btn btn-secondary w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Link>
                {user.role === 'MENTOR' && (
                  <Link href={`/admin/assignments/new?mentorId=${user.id}`} className="btn btn-primary w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Assign Student
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
