'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { ArrowLeft, Save, X, User, GraduationCap, BookOpen, DollarSign } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

interface Course {
  id: string
  title: string
  price: number
  duration: number
}

interface Enrollment {
  id: string
  studentId: string
  courseId: string
  totalAmount: number
  status: string
  student: User
  course: Course
}

export default function NewAssignment() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [mentors, setMentors] = useState<User[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [formData, setFormData] = useState({
    mentorId: '',
    enrollmentId: '',
    commissionRate: 37, // Default 37% commission
  })

  // Get enrollmentId from URL params
  const enrollmentIdFromUrl = searchParams.get('enrollmentId')

  useEffect(() => {
    // Fetch mentors and enrollments
    const fetchData = async () => {
      try {
        const [mentorsRes, enrollmentsRes] = await Promise.all([
          fetch('/api/users?role=MENTOR'),
          fetch('/api/enrollments'),
        ])
        
        if (mentorsRes.ok) {
          const mentorsData = await mentorsRes.json()
          setMentors(mentorsData.filter((user: User) => user.role === 'MENTOR'))
        }
        
        if (enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json()
          const activeEnrollments = enrollmentsData.filter((enrollment: Enrollment) => enrollment.status === 'ACTIVE')
          setEnrollments(activeEnrollments)
          
          // Auto-select enrollment if enrollmentId is provided in URL
          if (enrollmentIdFromUrl) {
            const enrollment = activeEnrollments.find(
              (enrollment) => enrollment.id === enrollmentIdFromUrl
            )
            if (enrollment) {
              setFormData(prev => ({
                ...prev,
                enrollmentId: enrollmentIdFromUrl
              }))
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [enrollmentIdFromUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/assignments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/assignments')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create assignment')
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'commissionRate' ? parseFloat(value) : value
    }))
  }

  const selectedEnrollment = enrollments.find(e => e.id === formData.enrollmentId)
  const selectedMentor = mentors.find(m => m.id === formData.mentorId)
  const commissionAmount = selectedEnrollment ? (selectedEnrollment.totalAmount * formData.commissionRate) / 100 : 0

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Mentor Assignment</h1>
              <p className="text-gray-600">Assign a mentor to a student for a specific course</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assignment Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Assignment Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mentor Selection */}
              <div>
                <label htmlFor="mentorId" className="label">
                  Select Mentor *
                </label>
                <select
                  id="mentorId"
                  name="mentorId"
                  required
                  value={formData.mentorId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Choose a mentor...</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.name} ({mentor.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student/Course Selection */}
              <div>
                <label htmlFor="enrollmentId" className="label">
                  Select Student & Course *
                </label>
                <select
                  id="enrollmentId"
                  name="enrollmentId"
                  required
                  value={formData.enrollmentId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Choose a student enrollment...</option>
                  {enrollments.map((enrollment) => (
                    <option key={enrollment.id} value={enrollment.id}>
                      {enrollment.student.name} - {enrollment.course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commission Rate */}
              <div>
                <label htmlFor="commissionRate" className="label">
                  Commission Rate (%) *
                </label>
                <input
                  type="number"
                  id="commissionRate"
                  name="commissionRate"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commissionRate}
                  onChange={handleChange}
                  className="input"
                  placeholder="37"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Default commission rate is 37%
                </p>
              </div>
            </div>
          </div>

          {/* Assignment Summary */}
          {selectedEnrollment && selectedMentor && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Assignment Summary
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Mentor</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{selectedMentor.name}</div>
                  <div className="text-sm text-gray-500">{selectedMentor.email}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <GraduationCap className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Student</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{selectedEnrollment.student.name}</div>
                  <div className="text-sm text-gray-500">{selectedEnrollment.student.email}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <BookOpen className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Course</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{selectedEnrollment.course.title}</div>
                  <div className="text-sm text-gray-500">{selectedEnrollment.course.duration} days</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Commission</span>
                  </div>
                  <div className="text-lg font-semibold text-green-600">₦{commissionAmount.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{formData.commissionRate}% of ₦{selectedEnrollment.totalAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.mentorId || !formData.enrollmentId}
              className="btn btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
