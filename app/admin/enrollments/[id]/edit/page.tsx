'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Tag } from 'lucide-react'
import { toast } from 'react-hot-toast'
import DiscountAdjustment from '@/components/DiscountAdjustment'

interface EnrollmentEditPageProps {
  params: {
    id: string
  }
}

interface EnrollmentData {
  id: string
  totalAmount: number
  paidAmount: number
  status: string
  startDate: string
  student: { name: string; email: string }
  course: { title: string; price: number }
  createdAt: string
  updatedAt: string
}

export default function EnrollmentEditPage({ params }: EnrollmentEditPageProps) {
  const { id } = params
  const router = useRouter()
  const { data: session, status } = useSession()

  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discountAdjustment, setDiscountAdjustment] = useState({
    type: 'none' as 'percentage' | 'fixed' | 'none',
    value: 0,
  })

  // Memoize the callback to prevent hook count changes
  const handleAmountChange = useCallback((newAmount: number, discountType: 'percentage' | 'fixed' | 'none', discountValue: number) => {
    setTotalAmount(newAmount)
    setDiscountAdjustment({
      type: discountType,
      value: discountValue
    })
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }

    const fetchEnrollment = async () => {
      try {
        const response = await fetch(`/api/enrollments/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch enrollment details.')
        }
        const data: EnrollmentData = await response.json()
        setEnrollment(data)
        setTotalAmount(data.totalAmount)
        setPaidAmount(data.paidAmount)
        setEnrollmentStatus(data.status)
        setStartDate(data.startDate.split('T')[0]) // Format date for input
      } catch (err: any) {
        setError(err.message)
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollment()
  }, [id, session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/enrollments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          totalAmount, 
          paidAmount, 
          status: enrollmentStatus,
          startDate: new Date(startDate).toISOString(),
          discountAdjustment
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update enrollment.')
      }

      toast.success('Enrollment updated successfully!')
      router.push(`/admin/enrollments/${id}`)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="ml-3 text-gray-600">Loading enrollment...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link href="/admin/enrollments" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Enrollments
          </Link>
        </div>
      </Layout>
    )
  }

  if (!enrollment) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Enrollment Not Found</h1>
          <p className="text-gray-600 mb-8">The enrollment you are looking for does not exist.</p>
          <Link href="/admin/enrollments" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Enrollments
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Enrollment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Updating enrollment for {enrollment.student.name} in {enrollment.course.title}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href={`/admin/enrollments/${id}`} className="btn btn-secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </Link>
          </div>
        </div>

        {/* Enrollment Context */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrollment Context</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <p><strong>Student:</strong> {enrollment.student.name} ({enrollment.student.email})</p>
            <p><strong>Course:</strong> {enrollment.course.title} (₦{enrollment.course.price.toLocaleString()})</p>
            <p><strong>Created:</strong> {new Date(enrollment.createdAt).toLocaleDateString()}</p>
            <p><strong>Last Updated:</strong> {new Date(enrollment.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
                  Total Amount (₦)
                </label>
                <input
                  type="number"
                  id="totalAmount"
                  name="totalAmount"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700">
                  Amount Paid (₦)
                </label>
                <input
                  type="number"
                  id="paidAmount"
                  name="paidAmount"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value))}
                  min="0"
                  max={totalAmount}
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={enrollmentStatus}
                  onChange={(e) => setEnrollmentStatus(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Direct Discount Adjustment */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Direct Price Adjustment
              </h3>
              <p className="text-xs text-blue-700 mb-4">
                Adjust the price for this specific student enrollment. This overrides the standard course price.
              </p>
              <DiscountAdjustment
                originalAmount={enrollment.course.price}
                currentAmount={totalAmount}
                onAmountChange={handleAmountChange}
                disabled={submitting}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
