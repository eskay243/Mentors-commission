'use client'

import Link from 'next/link'
import { Eye, Edit, Trash2, GraduationCap } from 'lucide-react'
import { useState } from 'react'

interface UserActionButtonsProps {
  userId: string
  userName: string
  userRole?: string
  onDelete: (userId: string, userName: string) => void
}

export default function UserActionButtons({ userId, userName, userRole, onDelete }: UserActionButtonsProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      setIsDeleting(true)
      try {
        await onDelete(userId, userName)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <Link 
        href={`/admin/users/${userId}`}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
        title="View Details"
      >
        <Eye className="h-3 w-3 mr-1" />
        View
      </Link>
      <Link 
        href={`/admin/users/${userId}/edit`}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 transition-colors"
        title="Edit User"
      >
        <Edit className="h-3 w-3 mr-1" />
        Edit
      </Link>
      {userRole === 'STUDENT' && (
        <Link 
          href={`/admin/enrollments/new?studentId=${userId}`}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
          title="Enroll in Course"
        >
          <GraduationCap className="h-3 w-3 mr-1" />
          Enroll
        </Link>
      )}
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Delete User"
      >
        <Trash2 className="h-3 w-3 mr-1" />
        Delete
      </button>
    </div>
  )
}
