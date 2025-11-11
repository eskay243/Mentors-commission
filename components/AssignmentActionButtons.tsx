'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit, Trash2, Eye, MoreVertical, UserCheck, UserX } from 'lucide-react'
import MentorReassignmentModal from './MentorReassignmentModal'

interface AssignmentActionButtonsProps {
  assignmentId: string
  assignmentData: {
    mentor: { 
      id: string
      name: string | null 
      email: string
    }
    student: { 
      id: string
      name: string | null 
      email: string
    }
    course: { 
      id: string
      title: string 
    }
  }
}

export default function AssignmentActionButtons({ assignmentId, assignmentData }: AssignmentActionButtonsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReassignmentModal, setShowReassignmentModal] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the assignment for ${assignmentData.mentor.name} and ${assignmentData.student.name}?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Assignment deleted successfully!')
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex-shrink-0 ml-4 relative">
      <div className="flex flex-col space-y-2">
        <Link 
          href={`/admin/assignments/${assignmentId}`}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Link>
        
        <Link 
          href={`/admin/assignments/${assignmentId}/edit`}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 transition-colors"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Link>
        
        <button 
          onClick={() => setShowReassignmentModal(true)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        >
          <UserCheck className="h-3 w-3 mr-1" />
          Manage
        </button>
        
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Reassignment Modal */}
      <MentorReassignmentModal
        isOpen={showReassignmentModal}
        onClose={() => setShowReassignmentModal(false)}
        assignmentId={assignmentId}
        currentMentor={assignmentData.mentor}
        studentName={assignmentData.student.name || assignmentData.student.email}
        courseTitle={assignmentData.course.title}
        onReassignmentComplete={() => {
          router.refresh() // Refresh the page to show updated data
        }}
      />
    </div>
  )
}
