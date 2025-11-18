'use client'

import { useRouter } from 'next/navigation'
import { Edit, Trash2, Eye, UserPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface EnrollmentActionButtonsProps {
  enrollmentId: string
  enrollmentData: {
    student: { name: string | null }
    course: { title: string }
  }
  hasAssignment: boolean
}

export default function EnrollmentActionButtons({ 
  enrollmentId, 
  enrollmentData, 
  hasAssignment 
}: EnrollmentActionButtonsProps) {
  const router = useRouter()
  const { data: session } = useSession()

  const handleDelete = async () => {
    if (!session || session.user.role !== 'ADMIN') {
      toast.error('You are not authorized to perform this action.')
      return
    }

    if (!confirm(`Are you sure you want to delete the enrollment for ${enrollmentData.student.name} in ${enrollmentData.course.title}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete enrollment.')
      }

      toast.success('Enrollment deleted successfully!')
      router.refresh() // Refresh the page to reflect the changes
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <Link
        href={`/admin/enrollments/${enrollmentId}`}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
      >
        <Eye className="h-3 w-3 mr-1" />
        View Details
      </Link>
      
      <Link
        href={`/admin/enrollments/${enrollmentId}/edit`}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 transition-colors"
      >
        <Edit className="h-3 w-3 mr-1" />
        Edit
      </Link>

      {!hasAssignment && (
        <Link
          href={`/admin/assignments/new?enrollmentId=${enrollmentId}`}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Assign Mentor
        </Link>
      )}

      <button
        onClick={handleDelete}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
      >
        <Trash2 className="h-3 w-3 mr-1" />
        Delete
      </button>
    </div>
  )
}
