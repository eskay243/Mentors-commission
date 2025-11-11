import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, Calendar, Users, Percent, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SearchParams {
  page?: string
  search?: string
  status?: string
}

interface AdminDiscountsProps {
  searchParams: SearchParams
}

export default async function AdminDiscounts({ searchParams }: AdminDiscountsProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const page = parseInt(searchParams.page || '1')
  const limit = 10
  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}
  
  if (searchParams.search) {
    where.OR = [
      { code: { contains: searchParams.search } },
      { name: { contains: searchParams.search } },
      { description: { contains: searchParams.search } },
    ]
  }
  
  if (searchParams.status) {
    if (searchParams.status === 'active') {
      where.isActive = true
    } else if (searchParams.status === 'inactive') {
      where.isActive = false
    } else if (searchParams.status === 'expired') {
      where.endDate = { lt: new Date() }
    }
  }

  const [discounts, totalCount] = await Promise.all([
    prisma.discount.findMany({
      where,
      include: {
        createdBy: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.discount.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / limit)

  const getStatusBadgeColor = (discount: any) => {
    const now = new Date()
    
    if (!discount.isActive) {
      return 'bg-gray-100 text-gray-800'
    }
    
    if (discount.endDate && discount.endDate < now) {
      return 'bg-red-100 text-red-800'
    }
    
    if (discount.startDate && discount.startDate > now) {
      return 'bg-yellow-100 text-yellow-800'
    }
    
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return 'bg-orange-100 text-orange-800'
    }
    
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (discount: any) => {
    const now = new Date()
    
    if (!discount.isActive) {
      return 'Inactive'
    }
    
    if (discount.endDate && discount.endDate < now) {
      return 'Expired'
    }
    
    if (discount.startDate && discount.startDate > now) {
      return 'Scheduled'
    }
    
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return 'Limit Reached'
    }
    
    return 'Active'
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Discount Management</h1>
          <Link href="/admin/discounts/new" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Discount
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search discounts..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                defaultValue={searchParams.search || ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          {discounts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No discounts found</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first discount.
              </p>
              <Link href="/admin/discounts/new" className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Discount
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {discounts.map((discount) => (
                <div key={discount.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    {/* Discount Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            {discount.type === 'PERCENTAGE' ? (
                              <Percent className="h-5 w-5 text-blue-600" />
                            ) : (
                              <DollarSign className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{discount.name}</h3>
                          <p className="text-sm text-gray-500 font-mono">{discount.code}</p>
                        </div>
                      </div>
                      
                      {/* Discount Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Value</span>
                          <p className="text-sm font-semibold text-gray-900">
                            {discount.type === 'PERCENTAGE' 
                              ? `${discount.value}%` 
                              : formatCurrency(discount.value)
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Usage</span>
                          <p className="text-sm font-semibold text-gray-900">
                            {discount.usedCount}{discount.usageLimit ? `/${discount.usageLimit}` : ''}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valid Until</span>
                          <p className="text-sm font-semibold text-gray-900">
                            {discount.endDate ? discount.endDate.toLocaleDateString() : 'No expiry'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(discount)}`}>
                              {getStatusText(discount)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Description */}
                      {discount.description && (
                        <p className="text-sm text-gray-600 mb-2">{discount.description}</p>
                      )}
                      
                      {/* Terms and Conditions */}
                      {discount.termsAndConditions && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Terms:</span> {discount.termsAndConditions}
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex-shrink-0 ml-4">
                      <div className="flex space-x-1">
                        <Link 
                          href={`/admin/discounts/${discount.id}`}
                          className="inline-flex items-center p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link 
                          href={`/admin/discounts/${discount.id}/edit`}
                          className="inline-flex items-center p-1.5 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors"
                          title="Edit Discount"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          className="inline-flex items-center p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                          title="Delete Discount"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
