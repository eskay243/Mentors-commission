import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaginationParams, createPaginatedResponse } from '@/lib/pagination'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const whereClause = role ? { role } : {}

    // Get pagination parameters
    const { page, limit, skip } = getPaginationParams(request)

    // Get total count for pagination
    const total = await prisma.user.count({ where: whereClause })

    // Fetch paginated users
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        mentorProfile: true,
        studentProfile: true,
        _count: {
          select: {
            enrollments: true,
            mentorAssignments: true,
            studentAssignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    return NextResponse.json(createPaginatedResponse(users, total, page, limit))
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
