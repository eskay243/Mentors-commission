import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import PaginatedUsersTable from '@/components/PaginatedUsersTable'

interface SearchParams {
  page?: string
  search?: string
  role?: string
  dateFrom?: string
  dateTo?: string
  enrollmentsMin?: string
  enrollmentsMax?: string
  hasPhone?: string
  sortBy?: string
  sortOrder?: string
}

interface PageProps {
  searchParams: SearchParams
}

export default async function AdminUsers({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const page = parseInt(searchParams.page || '1')
  const search = searchParams.search || ''
  const role = searchParams.role || ''
  const dateFrom = searchParams.dateFrom
  const dateTo = searchParams.dateTo
  const enrollmentsMin = searchParams.enrollmentsMin ? parseInt(searchParams.enrollmentsMin) : undefined
  const enrollmentsMax = searchParams.enrollmentsMax ? parseInt(searchParams.enrollmentsMax) : undefined
  const hasPhone = searchParams.hasPhone
  const sortBy = searchParams.sortBy || 'createdAt'
  const sortOrder = searchParams.sortOrder || 'desc'
  const limit = 10 // Users per page

  // Build where clause for filtering
  const where: any = {}
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ]
  }
  
  if (role) {
    where.role = role
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
    }
  }

  // Phone filter
  if (hasPhone === 'has') {
    where.phone = { not: null }
  } else if (hasPhone === 'missing') {
    where.phone = null
  }

  // Get total count for pagination
  const totalUsers = await prisma.user.count({ where })

  // Handle enrollments filtering separately since it requires a different approach
  let users
  if (enrollmentsMin !== undefined || enrollmentsMax !== undefined) {
    // For enrollment filtering, we need to use a different approach
    const allUsers = await prisma.user.findMany({
      where,
      include: {
        mentorProfile: true,
        studentProfile: true,
        enrollments: true,
        mentorAssignments: true,
        _count: {
          select: {
            enrollments: true,
            mentorAssignments: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    })

    // Filter by enrollments count
    users = allUsers.filter(user => {
      const enrollmentCount = user.role === 'STUDENT' ? user._count.enrollments : user._count.mentorAssignments
      if (enrollmentsMin !== undefined && enrollmentCount < enrollmentsMin) return false
      if (enrollmentsMax !== undefined && enrollmentCount > enrollmentsMax) return false
      return true
    })

    // Apply pagination
    const startIndex = (page - 1) * limit
    users = users.slice(startIndex, startIndex + limit)
  } else {
    // Regular query without enrollment filtering
    users = await prisma.user.findMany({
      where,
      include: {
        mentorProfile: true,
        studentProfile: true,
        _count: {
          select: {
            enrollments: true,
            mentorAssignments: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    })
  }

  const totalPages = Math.ceil(totalUsers / limit)

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <PaginatedUsersTable 
          users={users} 
          currentPage={page}
          totalPages={totalPages}
          totalUsers={totalUsers}
          search={search}
          role={role}
        />
      </div>
    </Layout>
  )
}