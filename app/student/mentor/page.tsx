import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { User, MessageSquare, Star, Clock, BookOpen, Mail } from 'lucide-react'

export default async function StudentMentor() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    redirect('/auth/signin')
  }

  // Fetch mentor assignments for the student
  const mentorAssignments = await prisma.mentorAssignment.findMany({
    where: { 
      studentId: session.user.id,
      status: 'ACTIVE'
    },
    include: {
      mentor: {
        include: {
          mentorProfile: true,
        },
      },
      course: true,
      enrollment: true,
    },
    orderBy: { assignedAt: 'desc' },
  })

  // Fetch recent messages with mentors
  const recentMessages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ],
    },
    include: {
      sender: true,
      receiver: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Mentors</h1>
          <p className="text-gray-600">Connect with your assigned mentors and track your learning progress</p>
        </div>

        {mentorAssignments.length > 0 ? (
          <div className="space-y-6">
            {mentorAssignments.map((assignment) => (
              <div key={assignment.id} className="card">
                <div className="flex items-start space-x-6">
                  {/* Mentor Avatar and Info */}
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-full bg-blue-300 flex items-center justify-center">
                      <span className="text-xl font-medium text-blue-800">
                        {assignment.mentor.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Mentor Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{assignment.mentor.name}</h2>
                        <p className="text-gray-600">{assignment.mentor.email}</p>
                        {assignment.mentor.mentorProfile && (
                          <div className="mt-2 flex items-center space-x-4">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="text-sm text-gray-600">
                                {assignment.mentor.mentorProfile.rating || 0}/5.0
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-600">
                                {assignment.mentor.mentorProfile.experience || 0} years experience
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Since {assignment.assignedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    {assignment.mentor.mentorProfile?.bio && (
                      <div className="mt-4">
                        <p className="text-gray-700">{assignment.mentor.mentorProfile.bio}</p>
                      </div>
                    )}

                    {/* Expertise */}
                    {assignment.mentor.mentorProfile?.expertise && assignment.mentor.mentorProfile.expertise.trim().length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Areas of Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {assignment.mentor.mentorProfile.expertise ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {assignment.mentor.mentorProfile.expertise}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">No expertise listed</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Course Information */}
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="text-sm font-medium text-gray-900">Course Assignment</h3>
                      </div>
                      <p className="text-sm text-gray-700">{assignment.course.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Course Duration: {assignment.course.duration} days
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex space-x-4">
                      <button className="btn btn-primary">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </button>
                      <button className="btn btn-secondary">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Mentor
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Recent Messages */}
            {recentMessages.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h2>
                <div className="space-y-3">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {message.sender.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{message.sender.name}</p>
                            <p className="text-sm text-gray-600">{message.content}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {message.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Mentors Assigned</h2>
            <p className="text-gray-600 mb-6">
              You don't have any mentors assigned to you yet. Mentors will be automatically assigned when you enroll in courses.
            </p>
            <button className="btn btn-primary">
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
