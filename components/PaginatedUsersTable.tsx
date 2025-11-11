'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Users, X, Calendar, Phone, UserCheck, BookOpen } from 'lucide-react'
import UserActionButtons from '@/components/UserActionButtons'

interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  createdAt: Date
  _count: {
    enrollments: number
    mentorAssignments: number
  }
}

interface PaginatedUsersTableProps {
  users: User[]
  currentPage: number
  totalPages: number
  totalUsers: number
  search: string
  role: string
}

interface FilterState {
  search: string
  role: string
  dateFrom: string
  dateTo: string
  enrollmentsMin: string
  enrollmentsMax: string
  hasPhone: string
  sortBy: string
  sortOrder: string
}

export default function PaginatedUsersTable({ 
  users, 
  currentPage, 
  totalPages, 
  totalUsers,
  search: initialSearch,
  role: initialRole
}: PaginatedUsersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterState>({
    search: initialSearch || '',
    role: initialRole || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    enrollmentsMin: searchParams.get('enrollmentsMin') || '',
    enrollmentsMax: searchParams.get('enrollmentsMax') || '',
    hasPhone: searchParams.get('hasPhone') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  })
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        window.location.reload()
      } else {
        const error = await response.json()
        
        // Show detailed error message for constraint violations
        if (error.error && error.error.includes('related records')) {
          alert(`Cannot delete ${userName}:\n\n${error.error}\n\nPlease remove the related records first or contact support for assistance.`)
        } else {
          alert(error.error || 'Failed to delete user')
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    // Add all non-empty filters to URL params
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        params.set(key, value.trim())
      }
    })
    
    params.delete('page') // Reset to page 1 when filtering
    
    router.push(`/admin/users?${params.toString()}`)
    setIsFilterOpen(false)
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      role: '',
      dateFrom: '',
      dateTo: '',
      enrollmentsMin: '',
      enrollmentsMax: '',
      hasPhone: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
    
    setFilters(clearedFilters)
    router.push('/admin/users')
    setIsFilterOpen(false)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`/admin/users?${params.toString()}`)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'MENTOR':
        return 'bg-blue-100 text-blue-800'
      case 'STUDENT':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.role) count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.enrollmentsMin) count++
    if (filters.enrollmentsMax) count++
    if (filters.hasPhone) count++
    if (filters.sortBy !== 'createdAt') count++
    if (filters.sortOrder !== 'desc') count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  // Quick filter presets
  const applyQuickFilter = (preset: string) => {
    let newFilters = { ...filters }
    
    switch (preset) {
      case 'newUsers':
        newFilters.dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 7 days
        break
      case 'studentsWithNoEnrollments':
        newFilters.role = 'STUDENT'
        newFilters.enrollmentsMin = '0'
        newFilters.enrollmentsMax = '0'
        break
      case 'allUsersNoCourses':
        newFilters.enrollmentsMin = '0'
        newFilters.enrollmentsMax = '0'
        break
      case 'mentorsNoAssignments':
        newFilters.role = 'MENTOR'
        newFilters.enrollmentsMin = '0'
        newFilters.enrollmentsMax = '0'
        break
      case 'mentors':
        newFilters.role = 'MENTOR'
        break
      case 'missingPhone':
        newFilters.hasPhone = 'missing'
        break
      case 'recentlyActive':
        newFilters.dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 30 days
        break
    }
    
    setFilters(newFilters)
    applyFilters()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>
        <Link href="/admin/users/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <form onSubmit={(e) => { e.preventDefault(); applyFilters() }}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2">
            {/* Role Filter */}
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MENTOR">Mentor</option>
              <option value="STUDENT">Student</option>
            </select>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                activeFiltersCount > 0 ? 'border-primary-500 text-primary-700 bg-primary-50' : ''
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Apply Button */}
            <button
              onClick={applyFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Apply
            </button>

            {/* Clear Button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Joined From
                </label>
                <input
                  type="date"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Joined To
                </label>
                <input
                  type="date"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              {/* Enrollments Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  Min Enrollments
                </label>
                <input
                  type="number"
                  min="0"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="0"
                  value={filters.enrollmentsMin}
                  onChange={(e) => handleFilterChange('enrollmentsMin', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  Max Enrollments
                </label>
                <input
                  type="number"
                  min="0"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="∞"
                  value={filters.enrollmentsMax}
                  onChange={(e) => handleFilterChange('enrollmentsMax', e.target.value)}
                />
              </div>

              {/* Phone Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Status
                </label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={filters.hasPhone}
                  onChange={(e) => handleFilterChange('hasPhone', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="has">Has Phone</option>
                  <option value="missing">No Phone</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <UserCheck className="h-4 w-4 inline mr-1" />
                  Sort By
                </label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="createdAt">Join Date</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="role">Role</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Course Assignment Filters */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-900 mb-2">📚 Users Without Course Assignments</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyQuickFilter('allUsersNoCourses')}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 border border-red-200"
              >
                🔍 All Users (No Courses)
              </button>
              <button
                onClick={() => applyQuickFilter('studentsWithNoEnrollments')}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200"
              >
                🎓 Students (No Enrollments)
              </button>
              <button
                onClick={() => applyQuickFilter('mentorsNoAssignments')}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 hover:bg-pink-200 border border-pink-200"
              >
                👨‍🏫 Mentors (No Assignments)
              </button>
            </div>
          </div>
        </div>

        {/* Other Quick Filter Presets */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Other Filters:</span>
            <button
              onClick={() => applyQuickFilter('newUsers')}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              New Users (7 days)
            </button>
            <button
              onClick={() => applyQuickFilter('mentors')}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
            >
              Mentors Only
            </button>
            <button
              onClick={() => applyQuickFilter('missingPhone')}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
            >
              Missing Phone
            </button>
            <button
              onClick={() => applyQuickFilter('recentlyActive')}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
            >
              Recently Active (30 days)
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * 10, totalUsers)}</span> of{' '}
            <span className="font-medium">{totalUsers}</span> users
          </p>
          {/* Show special message for users without course assignments */}
          {filters.enrollmentsMin === '0' && filters.enrollmentsMax === '0' && (
            <p className="text-sm text-orange-600 mt-1">
              📚 Showing users without course assignments - these users need to be enrolled in courses or assigned to students
            </p>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <div className="text-sm text-primary-600">
            {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.phone || <span className="text-gray-400 italic">No phone</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.role === 'STUDENT' ? (
                        <div>
                          <span className={`font-medium ${user._count.enrollments === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {user._count.enrollments}
                          </span>
                          {user._count.enrollments === 0 && (
                            <div className="text-xs text-red-500">No courses</div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className={`font-medium ${user._count.mentorAssignments === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {user._count.mentorAssignments}
                          </span>
                          {user._count.mentorAssignments === 0 && (
                            <div className="text-xs text-red-500">No assignments</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <UserActionButtons
                        userId={user.id}
                        userName={user.name || user.email}
                        userRole={user.role}
                        onDelete={handleDeleteUser}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
          aria-label="Pagination"
        >
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 mr-2" /> Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-5 w-5 ml-2" />
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 10, totalUsers)}</span> of{' '}
                <span className="font-medium">{totalUsers}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === currentPage
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600 focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}