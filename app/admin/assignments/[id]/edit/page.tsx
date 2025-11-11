'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X } from 'lucide-react'

interface Assignment {
  id: string
  commission: number
  status: string
  mentor: {
    name: string | null
    email: string
  }
  student: {
    name: string | null
    email: string
  }
  course: {
    title: string
  }
  enrollment: {
    totalAmount: number
  }
}

interface EditAssignmentProps {
  params: { id: string }
}

export default function EditAssignment({ params }: EditAssignmentProps) {
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    commission: '',
    status: '',
  })

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await fetch(`/api/assignments/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setAssignment(data)
          setFormData({
            commission: data.commission.toString(),
            status: data.status,
          })
        } else {
          alert('Failed to fetch assignment details')
          router.push('/admin/assignments')
        }
      } catch (error) {
        console.error('Error fetching assignment:', error)
        alert('Failed to fetch assignment details')
        router.push('/admin/assignments')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/assignments/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commission: parseFloat(formData.commission),
          status: formData.status,
        }),
      })

      if (response.ok) {
        alert('Assignment updated successfully!')
        router.push(`/admin/assignments/${params.id}`)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update assignment')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      alert('Failed to update assignment')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignment details...</p>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Assignment Not Found</h2>
          <Link href="/admin/assignments" className="btn btn-primary">
            Back to Assignments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link 
          href={`/admin/assignments/${params.id}`} 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Assignment Details
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Assignment</h1>
        <p className="text-gray-600 mt-1">
          {assignment.mentor.name} → {assignment.student.name} • {assignment.course.title}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Assignment Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Assignment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Mentor</h3>
              <p className="text-lg font-semibold text-gray-900">{assignment.mentor.name}</p>
              <p className="text-sm text-gray-500">{assignment.mentor.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Student</h3>
              <p className="text-lg font-semibold text-gray-900">{assignment.student.name}</p>
              <p className="text-sm text-gray-500">{assignment.student.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Course</h3>
              <p className="text-lg font-semibold text-gray-900">{assignment.course.title}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Enrollment Amount</h3>
              <p className="text-lg font-semibold text-gray-900">₦{assignment.enrollment.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="commission" className="block text-sm font-medium text-gray-700 mb-2">
                Commission Rate (%)
              </label>
              <input
                type="number"
                id="commission"
                min="0"
                max="100"
                step="0.01"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                The percentage of enrollment amount that goes to the mentor
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Current status of this assignment
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href={`/admin/assignments/${params.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
