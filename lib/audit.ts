/**
 * Audit logging utility
 * Logs all admin actions for compliance and debugging
 */

import { prisma } from './prisma'

export interface AuditLogData {
  userId: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes ? JSON.stringify(data.changes) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIp || undefined
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}

/**
 * Helper to create audit log from request
 */
export async function auditFromRequest(
  request: Request,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, any>
) {
  await createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    changes,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

