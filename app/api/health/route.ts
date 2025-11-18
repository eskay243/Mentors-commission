import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint
 * Returns the health status of the application and its dependencies
 */
export async function GET() {
  const startTime = Date.now()
  const health: {
    status: 'healthy' | 'unhealthy'
    timestamp: string
    uptime: number
    version: string
    database: {
      status: 'connected' | 'disconnected'
      responseTime?: number
    }
    memory: {
      used: number
      total: number
      percentage: number
    }
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    database: {
      status: 'disconnected',
    },
    memory: {
      used: 0,
      total: 0,
      percentage: 0,
    },
  }

  // Check database connection
  try {
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStartTime
    
    health.database = {
      status: 'connected',
      responseTime: dbResponseTime,
    }
  } catch (error) {
    health.status = 'unhealthy'
    health.database.status = 'disconnected'
    console.error('Database health check failed:', error)
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage()
  health.memory = {
    used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
    total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
    percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
  }

  const responseTime = Date.now() - startTime

  return NextResponse.json(
    {
      ...health,
      responseTime,
    },
    {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
      },
    }
  )
}

