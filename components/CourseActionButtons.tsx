'use client'

import Link from 'next/link'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface CourseActionButtonsProps {
  courseId: string
  courseTitle: string
  onDelete: (courseId: string, courseTitle: string) => void
}

export default function CourseActionButtons({ courseId, courseTitle, onDelete }: CourseActionButtonsProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone and will affect all enrollments and assignments.`)) {
      setIsDeleting(true)
      try {
        await onDelete(courseId, courseTitle)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="flex space-x-1">
      <Link 
        href={`/admin/courses/${courseId}`}
        className="inline-flex items-center p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
        title="View Details"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <Link 
        href={`/admin/courses/${courseId}/edit`}
        className="inline-flex items-center p-1.5 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors"
        title="Edit Course"
      >
        <Edit className="h-4 w-4" />
      </Link>
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className={`inline-flex items-center p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Delete Course"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
