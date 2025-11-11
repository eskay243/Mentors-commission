'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Users, BookOpen, Tag, X } from 'lucide-react'
import SearchableStudentSelect from '@/components/SearchableStudentSelect'
import SearchableCourseSelect from '@/components/SearchableCourseSelect'
import DiscountAdjustment from '@/components/DiscountAdjustment'

interface Student {
  id: string
  name: string | null
  email: string
  studentProfile?: {
    level: string | null
    goals: string | null
  }
}

interface Course {
  id: string
  title: string
  description: string | null
  price: number
  duration: number
  level: string
  category: string
}

export default function NewEnrollment() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    studentId: searchParams.get('studentId') || '',
    courseId: '',
    totalAmount: '',
    paidAmount: '0',
    status: 'ACTIVE',
    discountAdjustment: {
      type: 'none' as 'percentage' | 'fixed' | 'none',
      value: 0,
    }
  })
  const [discountCode, setDiscountCode] = useState('')

  // Memoize the callback to prevent hook count changes
  const handleAmountChange = useCallback((newAmount: number, discountType: 'percentage' | 'fixed' | 'none', discountValue: number) => {
    setFormData(prev => ({
      ...prev,
      totalAmount: newAmount.toString(),
      discountAdjustment: {
        type: discountType,
        value: discountValue
      }
    }))
  }, [])
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)
  const [discountLoading, setDiscountLoading] = useState(false)

  useEffect(() => {
    // Fetch students and courses
    const fetchData = async () => {
      try {
        const [studentsRes, coursesRes] = await Promise.all([
          fetch('/api/users?role=STUDENT'),
          fetch('/api/courses'),
        ])

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json()
          setStudents(studentsData)
        }

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(coursesData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/enrollments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          totalAmount: parseFloat(formData.totalAmount),
          paidAmount: parseFloat(formData.paidAmount),
          discountAdjustment: formData.discountAdjustment,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert('Student enrolled successfully!')
        router.push('/admin/enrollments')
      } else {
        alert(result.error || 'Failed to enroll student')
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
      alert('Failed to enroll student')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseChange = (courseId: string) => {
    const selectedCourse = courses.find(c => c.id === courseId)
    if (selectedCourse) {
      setFormData(prev => ({
        ...prev,
        courseId,
        totalAmount: selectedCourse.price.toString(),
      }))
      // Reset discount when course changes
      setAppliedDiscount(null)
      setDiscountCode('')
    }
  }

  const applyDiscount = async () => {
    if (!discountCode.trim() || !formData.courseId) {
      alert('Please select a course and enter a discount code')
      return
    }

    setDiscountLoading(true)
    try {
      const response = await fetch('/api/discounts/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discountCode: discountCode.trim(),
          coursePrice: parseFloat(formData.totalAmount),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setAppliedDiscount(result)
        setFormData(prev => ({
          ...prev,
          totalAmount: result.finalAmount.toString(),
        }))
        alert(`Discount applied! You saved ₦${result.discountAmount}`)
      } else {
        alert(result.error || 'Failed to apply discount')
      }
    } catch (error) {
      console.error('Error applying discount:', error)
      alert('Failed to apply discount')
    } finally {
      setDiscountLoading(false)
    }
  }

  const removeDiscount = () => {
    if (appliedDiscount) {
      setFormData(prev => ({
        ...prev,
        totalAmount: (parseFloat(prev.totalAmount) + appliedDiscount.discountAmount).toString(),
      }))
      setAppliedDiscount(null)
      setDiscountCode('')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/enrollments"
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Enrollments
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enroll Student in Course</h1>
        <p className="text-gray-600">Create a new course enrollment for a student</p>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Selection */}
            <SearchableStudentSelect
              students={students}
              selectedStudentId={formData.studentId}
              onStudentSelect={(studentId) => setFormData(prev => ({ ...prev, studentId }))}
              required
              placeholder="Search by name, email, or level..."
            />

            {/* Course Selection */}
            <SearchableCourseSelect
              courses={courses}
              selectedCourseId={formData.courseId}
              onCourseSelect={(courseId) => handleCourseChange(courseId)}
              onCourseChange={(course) => {
                // Auto-fill total amount when course is selected
                if (course) {
                  setFormData(prev => ({ ...prev, totalAmount: course.price.toString() }))
                }
              }}
              required
              placeholder="Search by title, level, or category..."
            />
          </div>

          {/* Course Details */}
          {formData.courseId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Selected Course Details</h3>
              {(() => {
                const selectedCourse = courses.find(c => c.id === formData.courseId)
                return selectedCourse ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Price:</span>
                      <p className="text-gray-600">{formatCurrency(selectedCourse.price)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Duration:</span>
                      <p className="text-gray-600">{selectedCourse.duration} days</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Level:</span>
                      <p className="text-gray-600">{selectedCourse.level}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <p className="text-gray-600">{selectedCourse.category}</p>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          )}

          {/* Direct Discount Adjustment */}
          {formData.courseId && formData.totalAmount && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Direct Price Adjustment
              </h3>
              <p className="text-xs text-blue-700 mb-4">
                Adjust the price for this specific student enrollment. This overrides the standard course price.
              </p>
              <DiscountAdjustment
                originalAmount={parseFloat(formData.totalAmount)}
                currentAmount={parseFloat(formData.totalAmount)}
                onAmountChange={handleAmountChange}
                disabled={loading}
              />
            </div>
          )}

          {/* Discount Code Section */}
          {formData.courseId && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-3 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Apply Discount Code (Alternative)
              </h3>
              
              {!appliedDiscount ? (
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyDiscount}
                    disabled={discountLoading || !discountCode.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {discountLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Discount Applied: {appliedDiscount.discount.code}
                      </p>
                      <p className="text-xs text-green-600">
                        {appliedDiscount.discount.name}
                      </p>
                      {appliedDiscount.discount.termsAndConditions && (
                        <p className="text-xs text-gray-600 mt-1">
                          Terms: {appliedDiscount.discount.termsAndConditions}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={removeDiscount}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount (₦) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.totalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                placeholder="Enter total amount"
              />
              <p className="mt-1 text-sm text-gray-500">
                {appliedDiscount 
                  ? `Discounted from ₦${(parseFloat(formData.totalAmount) + appliedDiscount.discountAmount).toLocaleString()}`
                  : 'This will be auto-filled based on course price'
                }
              </p>
            </div>

            {/* Paid Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid Amount (₦)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.paidAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
                placeholder="Enter paid amount"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave as 0 if no payment has been made yet
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enrollment Status
            </label>
            <select
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Payment Summary */}
          {formData.totalAmount && formData.paidAmount && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Payment Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {appliedDiscount && (
                  <>
                    <div>
                      <span className="font-medium text-blue-700">Original Price:</span>
                      <p className="text-blue-600">
                        {formatCurrency(parseFloat(formData.totalAmount) + appliedDiscount.discountAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Discount Applied:</span>
                      <p className="text-green-600">-{formatCurrency(appliedDiscount.discountAmount)}</p>
                    </div>
                  </>
                )}
                <div>
                  <span className="font-medium text-blue-700">Total Amount:</span>
                  <p className="text-blue-600">{formatCurrency(parseFloat(formData.totalAmount))}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Paid Amount:</span>
                  <p className="text-blue-600">{formatCurrency(parseFloat(formData.paidAmount))}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Remaining:</span>
                  <p className="text-blue-600">
                    {formatCurrency(parseFloat(formData.totalAmount) - parseFloat(formData.paidAmount))}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Payment Status:</span>
                  <p className="text-blue-600">
                    {parseFloat(formData.paidAmount) >= parseFloat(formData.totalAmount) 
                      ? 'Fully Paid' 
                      : parseFloat(formData.paidAmount) > 0 
                        ? 'Partially Paid' 
                        : 'Unpaid'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/enrollments"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
