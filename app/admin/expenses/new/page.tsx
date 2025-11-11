'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { ArrowLeft, Save, X, Receipt, DollarSign, Tag, FileText } from 'lucide-react'

export default function NewExpense() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'OPERATIONAL',
    receiptUrl: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/expenses')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create expense')
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('Failed to create expense')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const categories = [
    { value: 'OPERATIONAL', label: 'Operational', description: 'General business operations' },
    { value: 'MARKETING', label: 'Marketing', description: 'Advertising and promotional activities' },
    { value: 'INFRASTRUCTURE', label: 'Infrastructure', description: 'Technology and equipment costs' },
    { value: 'PERSONNEL', label: 'Personnel', description: 'Staff-related expenses' },
    { value: 'OTHER', label: 'Other', description: 'Miscellaneous expenses' },
  ]

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
              <h1 className="text-2xl font-bold text-gray-900">Add New Expense</h1>
              <p className="text-gray-600">Record a new business expense</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expense Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Expense Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="label">
                  Expense Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Office rent, Software subscription, Travel"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="input"
                  placeholder="Provide additional details about this expense..."
                />
              </div>

              <div>
                <label htmlFor="amount" className="label">
                  Amount (₦) *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  className="input"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="category" className="label">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {categories.find(c => c.value === formData.category)?.description}
                </p>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="receiptUrl" className="label">
                  Receipt URL (Optional)
                </label>
                <input
                  type="url"
                  id="receiptUrl"
                  name="receiptUrl"
                  value={formData.receiptUrl}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://example.com/receipt.pdf"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Link to receipt or supporting documentation
                </p>
              </div>
            </div>
          </div>

          {/* Category Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Expense Categories
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.value} className={`p-4 rounded-lg border-2 ${
                  formData.category === category.value 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <h3 className="font-medium text-gray-900">{category.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                </div>
              ))}
            </div>
          </div>

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
              disabled={loading}
              className="btn btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
